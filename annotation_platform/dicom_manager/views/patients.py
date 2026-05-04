from collections import defaultdict

from django.core.paginator import Paginator
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from annotation_platform.utils.permissions.patient import (
    CanDeletePatients,
    CanRetrievePatient,
    CanViewPatients,
)
from dicom_manager.models import Patient, Series, Study, Instance
from dicom_manager.serializers import PatientSerializer
from annotation_platform.utils.upload_file import get_presigned_url


class PatientsViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated(), CanDeletePatients()]
        if getattr(self, "action", None) == "retrieve":
            return [IsAuthenticated(), CanRetrievePatient()]
        return [IsAuthenticated(), CanViewPatients()]

    def get_queryset(self):
        return Patient.objects.filter(workspace=self.request.user.workspace).order_by(
            "-created_at"
        )

    def list(self, request, *args, **kwargs):
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

        queryset = self.filter_queryset(self.get_queryset())
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.page(page)
        serializer = self.get_serializer(page_obj.object_list, many=True)
        return Response(
            {
                "total_results": paginator.count,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        patient = get_object_or_404(
            Patient, id=kwargs["pk"], workspace=request.user.workspace
        )
        self.check_object_permissions(request, patient)

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
            return Response(
                {
                    "id": str(patient.id),
                    "PatientID": patient.PatientID,
                    "PatientName": patient.PatientName,
                    "PatientAge": patient.PatientAge,
                    "PatientSex": patient.PatientSex,
                    "created_at": patient.created_at,
                    "studies": [],
                },
                status=status.HTTP_200_OK,
            )

        study_ids = [s["id"] for s in studies]
        series_by_study_id = defaultdict(list)

        for row in (
            Series.objects.filter(study_id__in=study_ids)
            .annotate(total_instances=Count("instance"))
            .order_by("-created_at")
            .values(
                "id",
                "study_id",
                "SeriesInstanceUID",
                "SeriesDescription",
                "SeriesNumber",
                "Modality",
                "created_at",
                "total_instances",
            )
        ):
            study_key = row["study_id"]
            series_by_study_id[study_key].append(
                {k: v for k, v in row.items() if k != "study_id"}
            )

        studies_with_series = [
            {**study, "series": series_by_study_id.get(study["id"], [])}
            for study in studies
        ]
        return Response(
            {
                "id": str(patient.id),
                "PatientID": patient.PatientID,
                "PatientName": patient.PatientName,
                "PatientAge": patient.PatientAge,
                "PatientSex": patient.PatientSex,
                "created_at": patient.created_at,
                "studies": studies_with_series,
            },
            status=status.HTTP_200_OK,
        )


class SeriesViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    def get_permissions(self):
        return [IsAuthenticated(), CanRetrievePatient()]

    def retrieve(self, request, *args, **kwargs):
        patient_id = kwargs["patient_id"]
        study_id = kwargs["study_id"]
        series_id = kwargs["series_id"]

        patient = get_object_or_404(
            Patient, id=patient_id, workspace=request.user.workspace
        )
        self.check_object_permissions(request, patient)
        study = get_object_or_404(Study, id=study_id, patient=patient)
        series = get_object_or_404(Series, id=series_id, study=study)

        instances = [
            {
                "id": inst.id,
                "SOPInstanceUID": inst.SOPInstanceUID,
                "InstanceNumber": inst.InstanceNumber,
                "NumberOfFrames": inst.NumberOfFrames,
                "created_at": inst.created_at,
                "url_p10": get_presigned_url(inst.get_object_key_p10(), 1),
            }
            for inst in Instance.objects.filter(series=series).order_by("-created_at")
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
