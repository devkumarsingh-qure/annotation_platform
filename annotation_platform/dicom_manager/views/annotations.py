import json
import os
import tempfile

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from annotation_platform.utils.upload_file import upload_file
from dicom_manager.models import AnnotationSet

from .helpers import annotation_set_payload, resolve_series_for_user


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def annotations_for_series(request, patient_id, study_id, series_id):
    series, error_response = resolve_series_for_user(
        request, patient_id, study_id, series_id
    )
    if error_response is not None:
        return error_response

    if request.method == "GET":
        data = [
            annotation_set_payload(a)
            for a in AnnotationSet.objects.filter(series=series)
        ]
        return Response(data, status=status.HTTP_200_OK)

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
            try:
                annotation_set = AnnotationSet.objects.get(
                    id=annotation_set_id, series=series
                )
            except AnnotationSet.DoesNotExist:
                return Response(
                    {"detail": "Annotation set not found"},
                    status=status.HTTP_404_NOT_FOUND,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def annotation_set(request, patient_id, study_id, series_id, annotation_set_id):
    series, error_response = resolve_series_for_user(
        request, patient_id, study_id, series_id
    )
    if error_response is not None:
        return error_response

    ann_set = AnnotationSet.objects.filter(
        id=annotation_set_id, series=series
    ).first()
    if ann_set is None:
        return Response(
            {"detail": "Annotation set not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        annotation_set_payload(ann_set),
        status=status.HTTP_200_OK,
    )
