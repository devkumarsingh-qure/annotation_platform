from django.db import models
from django.conf import settings
from .series import Series


class Instance(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    SOPInstanceUID = models.CharField(unique=True, max_length=255)
    InstanceNumber = models.CharField(max_length=255, null=True, blank=True)
    NumberOfFrames = models.CharField(max_length=255, null=True, blank=True)

    def get_object_key_p10(self):
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        patient_dicomp10_s3_prefix = patient.get_dicomp10_s3_prefix()
        return f"{patient_dicomp10_s3_prefix}/studies/{study.id}/series/{series.id}/instances/{self.id}.dcm"
