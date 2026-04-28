from django.http import JsonResponse
from django.views.decorators.http import require_GET
from collections import defaultdict
from dicom_manager.models import Study, Patient, Series, Instance, AnnotationSet
import json
from django.db import transaction
from annotation_platform.utils.upload_file import get_presigned_url, upload_file
import tempfile
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@require_GET
def get_patients(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    patients = list(
        Patient.objects.filter(user=request.user)
        .order_by("-created_at")
        .values(
            "id",
            "PatientID",
            "PatientName",
            "PatientAge",
            "PatientSex",
            "created_at",
        )
    )

    return JsonResponse(patients, safe=False)


@require_GET
def get_studies_for_patient(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    patient = Patient.objects.filter(id=patient_id, user=request.user).first()
    if patient is None:
        return JsonResponse({"detail": "Patient not found"}, status=404)

    studies = list(
        Study.objects.filter(patient=patient)
        .order_by("-created_at")
        .values(
            "id",
            "StudyInstanceUID",
            "AccessionNumber",
            "StudyDescription",
            "created_at",
        )
    )

    if not studies:
        return JsonResponse([], safe=False)

    study_ids = [study["id"] for study in studies]
    series_by_study_id = defaultdict(list)

    for series in (
        Series.objects.filter(study_id__in=study_ids)
        .order_by("-created_at")
        .values(
            "id",
            "study_id",
            "SeriesInstanceUID",
            "SeriesDescription",
            "SeriesNumber",
            "Modality",
            "created_at",
        )
    ):
        series_by_study_id[series["study_id"]].append(
            {
                "id": series["id"],
                "SeriesInstanceUID": series["SeriesInstanceUID"],
                "SeriesDescription": series["SeriesDescription"],
                "SeriesNumber": series["SeriesNumber"],
                "Modality": series["Modality"],
                "created_at": series["created_at"],
            }
        )

    studies_with_series = []
    for study in studies:
        studies_with_series.append(
            {
                **study,
                "series": series_by_study_id.get(study["id"], []),
            }
        )

    return JsonResponse(studies_with_series, safe=False)


@require_GET
def get_series(request, patient_id, study_id, series_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    patient = Patient.objects.get(id=patient_id, user=request.user)
    if patient is None:
        return JsonResponse({"detail": "Patient not found"}, status=404)

    study = Study.objects.get(id=study_id, patient=patient)
    if study is None:
        return JsonResponse({"detail": "Study not found"}, status=404)

    series = Series.objects.get(id=series_id, study=study)
    if series is None:
        return JsonResponse({"detail": "Series not found"}, status=404)

    instances = []
    for instance in Instance.objects.filter(series=series).order_by("-created_at"):
        instances.append(
            {
                "id": instance.id,
                "SOPInstanceUID": instance.SOPInstanceUID,
                "InstanceNumber": instance.InstanceNumber,
                "NumberOfFrames": instance.NumberOfFrames,
                "created_at": instance.created_at,
                "url_p10": get_presigned_url(instance.get_object_key_p10(), 1),
            }
        )

    return JsonResponse(
        {
            "id": series.id,
            "SeriesInstanceUID": series.SeriesInstanceUID,
            "SeriesDescription": series.SeriesDescription,
            "SeriesNumber": series.SeriesNumber,
            "Modality": series.Modality,
            "created_at": series.created_at,
            "instances": instances,
        },
        safe=False,
    )


def _get_series_for_user(request, patient_id, study_id, series_id):
    patient = Patient.objects.filter(id=patient_id, user=request.user).first()
    if patient is None:
        return None, Response(
            {"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
        )

    study = Study.objects.filter(id=study_id, patient=patient).first()
    if study is None:
        return None, Response(
            {"detail": "Study not found"}, status=status.HTTP_404_NOT_FOUND
        )

    series = Series.objects.filter(id=series_id, study=study).first()
    if series is None:
        return None, Response(
            {"detail": "Series not found"}, status=status.HTTP_404_NOT_FOUND
        )

    return series, None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def annotations_for_series(request, patient_id, study_id, series_id):
    series, error_response = _get_series_for_user(
        request, patient_id, study_id, series_id
    )
    if error_response is not None:
        return error_response

    if request.method == "GET":
        annotations_data = []
        for annotation_set in AnnotationSet.objects.filter(series=series):
            annotations_data.append(
                {
                    "id": annotation_set.id,
                    "created_at": annotation_set.created_at,
                    "url": get_presigned_url(annotation_set.get_object_key(), 1),
                }
            )
        return Response(annotations_data, status=status.HTTP_200_OK)
    elif request.method == "POST":
        annotation_set_id = request.data.get("annotationSetId")
        annotations_json = request.data.get("annotations")
        if annotations_json is None:
            return Response(
                {"detail": "Annotations JSON not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if annotation_set_id is None:
                annotation_set = AnnotationSet.objects.create(series=series)
            else:
                annotation_set = AnnotationSet.objects.get(
                    id=annotation_set_id, series=series
                )
            key = annotation_set.get_object_key()
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", suffix=".json", delete=False
            ) as tmp:
                json.dump(annotations_json, tmp)
                tmp.flush()
                temp_path = tmp.name

            try:
                upload_file(temp_path, key)
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        return Response({"detail": "Annotations saved"}, status=status.HTTP_200_OK)
    else:
        return Response(
            {"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def annotation_set(request, patient_id, study_id, series_id, annotation_set_id):
    series, error_response = _get_series_for_user(
        request, patient_id, study_id, series_id
    )
    if error_response is not None:
        return error_response

    if request.method == "GET":
        annotation_set = AnnotationSet.objects.get(id=annotation_set_id, series=series)
        return Response(
            {
                "id": annotation_set.id,
                "created_at": annotation_set.created_at,
                "url": get_presigned_url(annotation_set.get_object_key(), 1),
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
