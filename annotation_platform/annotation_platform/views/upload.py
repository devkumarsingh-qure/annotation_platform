import os
import tempfile

import pydicom
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from pydicom.dataelem import DataElement

from annotation_platform.utils.upload_file import upload_file
from dicom_manager.models import Instance, Patient, Series, Study


def dicom_value_to_str(raw) -> str | None:
    """Coerce pydicom DataElement (or a raw value) to str/None; PersonName and similar become JSON- and ORM-safe."""
    if raw is None:
        return None
    if isinstance(raw, DataElement):
        if getattr(raw, "value", None) in (None, ""):
            return None
        val = raw.value
    else:
        val = raw
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


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

    return JsonResponse(file_statuses)
