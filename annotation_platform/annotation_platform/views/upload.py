import os
import tempfile

import pydicom
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from annotation_platform.utils.upload_file import upload_file
from dicom_manager.models import Instance, Patient, Series, Study


@require_POST
def upload(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    user = request.user

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
            PatientID = ds.get("PatientID")
            PatientName = ds.get("PatientName")
            PatientAge = ds.get("PatientAge")
            PatientSex = ds.get("PatientSex")

            StudyInstanceUID = ds.get("StudyInstanceUID")
            AccessionNumber = ds.get("AccessionNumber")
            StudyDescription = ds.get("StudyDescription")

            SeriesInstanceUID = ds.get("SeriesInstanceUID")
            SeriesDescription = ds.get("SeriesDescription")
            SeriesNumber = ds.get("SeriesNumber")
            Modality = ds.get("Modality")

            SOPInstanceUID = ds.get("SOPInstanceUID")
            InstanceNumber = ds.get("InstanceNumber")
            NumberOfFrames = ds.get("NumberOfFrames")

            with transaction.atomic():
                try:
                    patient = Patient.objects.get(user=user, PatientID=PatientID)
                except Patient.DoesNotExist:
                    patient = Patient.objects.create(
                        user=user,
                        PatientID=PatientID,
                        PatientName=PatientName,
                        PatientAge=PatientAge,
                        PatientSex=PatientSex,
                    )
                except Exception as e:
                    return JsonResponse({"detail": str(e)}, status=400)
                
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
            }
        except Exception as e:
            file_statuses[file.name] = {
                "success": False,
                "error": str(e),
            }
        finally:
            if tmp_path and os.path.isfile(tmp_path):
                os.unlink(tmp_path)

    return JsonResponse(file_statuses)
