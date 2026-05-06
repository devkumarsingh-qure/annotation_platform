from typing import Optional

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView, status

from annotation_platform.utils.helpers import check_for_admin
from dicom_manager.models.patient import Patient
from dicom_manager.models.series import Series
from dicom_manager.models.study import Study
from dicom_manager.utils.helpers import (
    resolve_patients_for_user,
    resolve_patient_for_user,
)
from dicom_manager.models import Instance
from annotation_platform.utils.upload_file import get_presigned_url
from authentication.models.user import User


class PatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: User = request.user

        try:
            page = int(request.query_params.get("page"))
            page_size = int(request.query_params.get("page_size"))
            if page < 1 or page_size < 1:
                raise ValueError("page and page_size must be positive integers")
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        search = request.query_params.get("search", "")
        age_range = request.query_params.get("age_range", "")
        gender = request.query_params.get("gender", "")
        
        patients, total = resolve_patients_for_user(user, page, page_size, search, age_range, gender)
        return Response(
            {
                "page": page,
                "total": total,
                "results": [patient.serialize() for patient in patients],
            },
            status=status.HTTP_200_OK,
        )


class PatientView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id: int):
        user: User = request.user
        patient = resolve_patient_for_user(user, patient_id)
        studies = []
        for study in patient.study_set.all():
            studies.append(
                {
                    **study.serialize(),
                    "series": [],
                }
            )
            for series in study.series_set.all():
                studies[-1]["series"].append(series.serialize())

        return Response(
            {
                **patient.serialize(),
                "studies": studies,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, patient_id: int):
        user: User = request.user
        check_for_admin(user)

        patient = get_object_or_404(Patient, id=patient_id, workspace=user.workspace)
        patient.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SeriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id: int, study_id: int, series_id: int):
        patient = resolve_patient_for_user(request.user, patient_id)
        study = Study.objects.get(id=study_id, patient=patient)
        series = Series.objects.get(id=series_id, study=study)

        instances = [
            {
                "id": instance.id,
                "SOPInstanceUID": instance.SOPInstanceUID,
                "InstanceNumber": instance.InstanceNumber,
                "NumberOfFrames": instance.NumberOfFrames,
                "created_at": instance.created_at,
                "url_p10": get_presigned_url(instance.get_object_key(), 1),
            }
            for instance in Instance.objects.filter(series=series).order_by(
                "-created_at"
            )
        ]

        return Response(
            {
                "id": series.id,
                "PatientID": patient.PatientID,
                "StudyInstanceUID": study.StudyInstanceUID,
                "SeriesInstanceUID": series.SeriesInstanceUID,
                "SeriesDescription": series.SeriesDescription,
                "SeriesNumber": series.SeriesNumber,
                "Modality": series.Modality,
                "created_at": series.created_at,
                "instances": instances,
            },
            status=status.HTTP_200_OK,
        )
