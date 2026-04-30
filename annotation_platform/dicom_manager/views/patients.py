from collections import defaultdict

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.core.paginator import Paginator
from django.db.models import Count
from annotation_platform.utils.upload_file import get_presigned_url
from dicom_manager.models import Instance, Patient, Series, Study


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_patients(request):
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

    total_results = Patient.objects.filter(user=request.user).count()
    patients = Patient.objects.filter(user=request.user).order_by("-created_at")
    paginator = Paginator(patients, page_size)
    page_obj = paginator.page(page)
    paginated_patients = page_obj.object_list.values(
        "id",
        "PatientID",
        "PatientName",
        "PatientAge",
        "PatientSex",
        "created_at",
    )

    return Response(
        {
            "total_results": total_results,
            "results": paginated_patients,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def patient_details(request, patient_id):
    patient = Patient.objects.get(id=patient_id, user=request.user)
    if patient is None:
        return Response(
            {"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        return Response(
            {
                "id": patient.id,
                "PatientID": patient.PatientID,
                "PatientName": patient.PatientName,
                "PatientAge": patient.PatientAge,
                "PatientSex": patient.PatientSex,
                "created_at": patient.created_at,
            },
            status=status.HTTP_200_OK,
        )
    elif request.method == "DELETE":
        patient.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    else:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_studies_for_patient(request, patient_id):
    patient = Patient.objects.get(id=patient_id, user=request.user)
    if patient is None:
        return Response(
            {"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
        )

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
        return Response([], status=status.HTTP_200_OK)

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
    return Response(studies_with_series, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_series(request, patient_id, study_id, series_id):
    patient = Patient.objects.get(id=patient_id, user=request.user)
    if patient is None:
        return Response(
            {"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
        )

    study = Study.objects.get(id=study_id, patient=patient)
    if study is None:
        return Response({"detail": "Study not found"}, status=status.HTTP_404_NOT_FOUND)

    series = Series.objects.get(id=series_id, study=study)
    if series is None:
        return Response(
            {"detail": "Series not found"}, status=status.HTTP_404_NOT_FOUND
        )

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
