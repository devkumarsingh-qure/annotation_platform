from typing import List

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from dicom_manager.models import AnnotationSet
from authentication.models.user import User
from dicom_manager.models import Patient, Study, Series
from .helpers import upload_annotation_set


class AnnotationSetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id, study_id, series_id):
        user: User = request.user
        patient = get_object_or_404(Patient, workspace=user.workspace, id=patient_id)
        study = get_object_or_404(Study, patient=patient, id=study_id)
        series = get_object_or_404(Series, study=study, id=series_id)

        annotation_sets: List[AnnotationSet] = AnnotationSet.objects.filter(
            user=user, series=series
        )

        return Response(
            {
                "PatientID": patient.PatientID,
                "StudyInstanceUID": study.StudyInstanceUID,
                "SeriesInstanceUID": series.SeriesInstanceUID,
                "annotation_sets": [
                    annotation_set.serialize() for annotation_set in annotation_sets
                ],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, patient_id, study_id, series_id):
        annotations_json = request.data.get("annotations_json")
        if annotations_json is None:
            return Response(
                {"detail": "AnnotationSet JSON not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user: User = request.user
        patient = get_object_or_404(Patient, workspace=user.workspace, id=patient_id)
        study = get_object_or_404(Study, patient=patient, id=study_id)
        series = get_object_or_404(Series, study=study, id=series_id)

        with transaction.atomic():
            annotation_set: AnnotationSet = AnnotationSet.objects.create(
                user=user, series=series
            )

            key = annotation_set.get_object_key()
            upload_annotation_set(key, annotations_json)

        return Response(
            annotation_set.serialize(),
            status=status.HTTP_200_OK,
        )


class AnnotationSetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id, study_id, series_id, annotation_set_id):
        user: User = request.user
        patient = get_object_or_404(Patient, workspace=user.workspace, id=patient_id)
        study = get_object_or_404(Study, patient=patient, id=study_id)
        series = get_object_or_404(Series, study=study, id=series_id)
        annotation_set: AnnotationSet = get_object_or_404(
            AnnotationSet, id=annotation_set_id, series=series, user=user
        )
        return Response(annotation_set.serialize(), status=status.HTTP_200_OK)

    def put(self, request, patient_id, study_id, series_id, annotation_set_id):
        annotations_json = request.data.get("annotations_json")
        if annotations_json is None:
            return Response(
                {"detail": "AnnotationSet JSON not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user: User = request.user
        patient = get_object_or_404(Patient, workspace=user.workspace, id=patient_id)
        study = get_object_or_404(Study, patient=patient, id=study_id)
        series = get_object_or_404(Series, study=study, id=series_id)
        annotation_set: AnnotationSet = get_object_or_404(
            AnnotationSet, id=annotation_set_id, series=series, user=user
        )
        with transaction.atomic():
            key = annotation_set.get_object_key()
            upload_annotation_set(key, annotations_json)
        return Response(annotation_set.serialize(), status=status.HTTP_200_OK)

    def delete(self, request, patient_id, study_id, series_id, annotation_set_id):
        user: User = request.user
        patient = get_object_or_404(Patient, workspace=user.workspace, id=patient_id)
        study = get_object_or_404(Study, patient=patient, id=study_id)
        series = get_object_or_404(Series, study=study, id=series_id)
        annotation_set: AnnotationSet = get_object_or_404(
            AnnotationSet, id=annotation_set_id, user=user, series=series
        )
        with transaction.atomic():
            annotation_set.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
