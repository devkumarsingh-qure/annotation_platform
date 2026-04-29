from rest_framework import status
from rest_framework.response import Response

from annotation_platform.utils.upload_file import get_presigned_url
from dicom_manager.models import Patient, Series, Study


def resolve_series_for_user(request, patient_id, study_id, series_id):
    """Return (series, None) on success, or (None, error Response) if not found."""
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


def annotation_set_payload(annotation_set):
    return {
        "id": annotation_set.id,
        "created_at": annotation_set.created_at,
        "url": get_presigned_url(annotation_set.get_object_key(), 1),
    }
