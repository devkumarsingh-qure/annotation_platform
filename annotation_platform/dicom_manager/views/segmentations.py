import os
import tempfile
from contextlib import contextmanager

import pydicom
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from pydicom.errors import InvalidDicomError
from pydicom.uid import SegmentationStorage
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from annotation_platform.models import Project
from annotation_platform.utils.upload_file import upload_file
from dicom_manager.models import SegmentationMask, Series

SEGMENTATION_CONTENT_TYPE = "application/dicom"


def _resolve_context(user, patient_id, study_id, series_id, project_id):
    if not project_id:
        raise ValidationError({"project_id": "Project ID is required."})

    series = get_object_or_404(
        Series.objects.select_related("study__patient"),
        id=series_id,
        study_id=study_id,
        study__patient_id=patient_id,
        study__patient__workspace=user.workspace,
    )
    projects = Project.objects.filter(
        id=project_id,
        workspace=user.workspace,
        patients=series.study.patient,
    )
    if not user.is_workspace_admin:
        projects = projects.filter(members=user)
    return get_object_or_404(projects), series


def _validate_upload_file(uploaded_file):
    if uploaded_file is None:
        raise ValidationError({"file": "A DICOM SEG file is required."})
    if uploaded_file.size <= 0:
        raise ValidationError(
            {"file": "The DICOM SEG file must not be empty."}
        )
    if uploaded_file.size > settings.SEGMENTATION_MAX_UPLOAD_BYTES:
        raise ValidationError(
            {
                "file": (
                    "DICOM SEG file exceeds the configured "
                    f"{settings.SEGMENTATION_MAX_UPLOAD_BYTES} byte limit."
                )
            }
        )


@contextmanager
def _temporary_uploaded_file(uploaded_file):
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".dcm", delete=False) as temporary:
            temporary_path = temporary.name
            for chunk in uploaded_file.chunks():
                temporary.write(chunk)
        yield temporary_path
    finally:
        if temporary_path and os.path.isfile(temporary_path):
            os.unlink(temporary_path)


def _parse_dicom_segmentation(path, series):
    try:
        dataset = pydicom.dcmread(path, defer_size="1 MB")
    except (InvalidDicomError, OSError, ValueError) as error:
        raise ValidationError(
            {"file": "The uploaded file is not valid DICOM."}
        ) from error

    if str(dataset.get("SOPClassUID", "")) != str(SegmentationStorage):
        raise ValidationError(
            {"file": "The DICOM file must use the Segmentation Storage SOP Class."}
        )
    if str(dataset.get("Modality", "")).upper() != "SEG":
        raise ValidationError({"file": "The DICOM file modality must be SEG."})
    if str(dataset.get("StudyInstanceUID", "")) != series.study.StudyInstanceUID:
        raise ValidationError(
            {"file": "The DICOM SEG does not belong to the requested study."}
        )

    referenced_series = dataset.get("ReferencedSeriesSequence", [])
    if not any(
        str(item.get("SeriesInstanceUID", "")) == series.SeriesInstanceUID
        for item in referenced_series
    ):
        raise ValidationError(
            {"file": "The DICOM SEG does not reference the requested source series."}
        )

    if not dataset.get("SOPInstanceUID") or not dataset.get("SeriesInstanceUID"):
        raise ValidationError(
            {"file": "The DICOM SEG is missing required instance identifiers."}
        )
    try:
        number_of_frames = int(dataset.get("NumberOfFrames", 0))
    except (TypeError, ValueError):
        number_of_frames = 0
    if number_of_frames <= 0 or "PixelData" not in dataset:
        raise ValidationError(
            {"file": "The DICOM SEG does not contain segmentation frames."}
        )

    for field in ("ContentDescription", "SeriesDescription", "ContentLabel"):
        label = str(dataset.get(field, "")).strip()
        if label:
            return label
    return "Segmentation"


def _save_segmentation(mask, temporary_path):
    with transaction.atomic():
        mask.save()
        upload_file(
            temporary_path,
            mask.get_object_key(),
            content_type=SEGMENTATION_CONTENT_TYPE,
        )
    return mask


class SegmentationMasksView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get(self, request, patient_id, study_id, series_id):
        project, series = _resolve_context(
            request.user,
            patient_id,
            study_id,
            series_id,
            request.query_params.get("project_id"),
        )
        masks = SegmentationMask.objects.filter(
            user=request.user,
            project=project,
            series=series,
        )
        return Response(
            {
                "segmentation_masks": [
                    mask.serialize(include_urls=True) for mask in masks
                ]
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, patient_id, study_id, series_id):
        project, series = _resolve_context(
            request.user,
            patient_id,
            study_id,
            series_id,
            request.query_params.get("project_id"),
        )
        uploaded_file = request.FILES.get("file")
        _validate_upload_file(uploaded_file)

        with _temporary_uploaded_file(uploaded_file) as temporary_path:
            label = _parse_dicom_segmentation(temporary_path, series)
            mask = _save_segmentation(
                SegmentationMask(
                    user=request.user,
                    project=project,
                    series=series,
                    label=label,
                ),
                temporary_path,
            )

        return Response(
            mask.serialize(include_urls=True),
            status=status.HTTP_201_CREATED,
        )


class SegmentationMaskView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def _get_mask(self, request, patient_id, study_id, series_id, mask_id):
        project, series = _resolve_context(
            request.user,
            patient_id,
            study_id,
            series_id,
            request.query_params.get("project_id"),
        )
        return get_object_or_404(
            SegmentationMask,
            id=mask_id,
            user=request.user,
            project=project,
            series=series,
        )

    def get(self, request, patient_id, study_id, series_id, mask_id):
        mask = self._get_mask(request, patient_id, study_id, series_id, mask_id)
        return Response(
            mask.serialize(include_urls=True),
            status=status.HTTP_200_OK,
        )

    def put(self, request, patient_id, study_id, series_id, mask_id):
        mask = self._get_mask(request, patient_id, study_id, series_id, mask_id)
        uploaded_file = request.FILES.get("file")
        _validate_upload_file(uploaded_file)

        with _temporary_uploaded_file(uploaded_file) as temporary_path:
            mask.label = _parse_dicom_segmentation(
                temporary_path,
                mask.series,
            )
            _save_segmentation(mask, temporary_path)
        return Response(
            mask.serialize(include_urls=True),
            status=status.HTTP_200_OK,
        )

    def delete(self, request, patient_id, study_id, series_id, mask_id):
        mask = self._get_mask(request, patient_id, study_id, series_id, mask_id)
        mask.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
