import os
import tempfile

import pydicom
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from annotation_platform.utils.upload_file import upload_file
from dicom_manager.models import Instance, Patient, Series, Study
from dicom_manager.utils.helpers import dicom_value_to_str
from annotation_platform.utils.permissions.patient import CanCreatePatients


class UploadView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), CanCreatePatients()]

    def post(self, request):
        file_statuses = {}
        files = request.FILES.getlist("files")
        for file in files:
            tmp_path = None
            try:
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    for chunk in file.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name

                ds = pydicom.dcmread(tmp_path)
                PatientID = dicom_value_to_str(ds.get("PatientID"))
                PatientName = dicom_value_to_str(ds.get("PatientName"))
                PatientAge = dicom_value_to_str(ds.get("PatientAge"))
                PatientSex = dicom_value_to_str(ds.get("PatientSex"))

                StudyInstanceUID = dicom_value_to_str(ds.get("StudyInstanceUID"))
                AccessionNumber = dicom_value_to_str(ds.get("AccessionNumber"))
                StudyDescription = dicom_value_to_str(ds.get("StudyDescription"))

                SeriesInstanceUID = dicom_value_to_str(ds.get("SeriesInstanceUID"))
                SeriesDescription = dicom_value_to_str(ds.get("SeriesDescription"))
                SeriesNumber = dicom_value_to_str(ds.get("SeriesNumber"))
                Modality = dicom_value_to_str(ds.get("Modality"))

                SOPInstanceUID = dicom_value_to_str(ds.get("SOPInstanceUID"))
                InstanceNumber = dicom_value_to_str(ds.get("InstanceNumber"))
                NumberOfFrames = dicom_value_to_str(ds.get("NumberOfFrames"))

                user = request.user
                with transaction.atomic():
                    try:
                        patient = Patient.objects.get(
                            workspace=user.workspace, PatientID=PatientID
                        )
                    except Patient.DoesNotExist:
                        patient = Patient.objects.create(
                            workspace=user.workspace,
                            PatientID=PatientID,
                            PatientName=PatientName,
                            PatientAge=PatientAge,
                            PatientSex=PatientSex,
                        )
                    except Exception as e:
                        return Response(
                            {"detail": str(e)},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    study, study_created = Study.objects.get_or_create(
                        patient=patient,
                        StudyInstanceUID=StudyInstanceUID,
                        AccessionNumber=AccessionNumber,
                        StudyDescription=StudyDescription,
                    )
                    series, series_created = Series.objects.get_or_create(
                        study=study,
                        SeriesInstanceUID=SeriesInstanceUID,
                        SeriesDescription=SeriesDescription,
                        SeriesNumber=SeriesNumber,
                        Modality=Modality,
                    )
                    instance, instance_created = Instance.objects.get_or_create(
                        series=series,
                        SOPInstanceUID=SOPInstanceUID,
                        InstanceNumber=InstanceNumber,
                        NumberOfFrames=NumberOfFrames,
                    )

                    key = instance.get_object_key_p10()
                    upload_file(tmp_path, key)

                file_statuses[file.name] = {
                    "success": True,
                    "patient": {
                        "id": patient.id,
                        "PatientID": patient.PatientID,
                        "PatientName": patient.PatientName,
                        "PatientAge": patient.PatientAge,
                        "PatientSex": patient.PatientSex,
                        "created_at": patient.created_at,
                    },
                }
            except Exception as e:
                file_statuses[file.name] = {
                    "success": False,
                    "error": str(e),
                }
            finally:
                if tmp_path and os.path.isfile(tmp_path):
                    os.unlink(tmp_path)

        return Response(file_statuses)
