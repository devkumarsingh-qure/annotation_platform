from django.db import models
from django.conf import settings
from .series import Series
from annotation_platform.utils.upload_file import _s3_client


class Instance(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    SOPInstanceUID = models.CharField(unique=True, max_length=255)
    InstanceNumber = models.CharField(max_length=255, null=True, blank=True)
    NumberOfFrames = models.CharField(max_length=255, null=True, blank=True)

    def get_object_key_p10(self):
        user = self.series.study.patient.user
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        return f"{user.id}/dicomp10/{patient.id}/studies/{study.id}/series/{series.id}/instances/{self.id}.dcm"
