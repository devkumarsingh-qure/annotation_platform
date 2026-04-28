from django.db import models
from .series import Series
from annotation_platform.utils.upload_file import _s3_client
from django.conf import settings


class AnnotationSet(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_object_key(self):
        user = self.series.study.patient.user
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        return f"{user.id}/annotation-sets/{patient.id}/studies/{study.id}/series/{series.id}/annotation-sets/{self.id}.json"
