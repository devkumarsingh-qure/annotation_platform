from django.db import models
from .study import Study


class Series(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    SeriesInstanceUID = models.CharField(unique=True, max_length=255)
    SeriesDescription = models.CharField(max_length=255, null=True, blank=True)
    SeriesNumber = models.CharField(max_length=255, null=True, blank=True)
    Modality = models.CharField(max_length=255, null=True, blank=True)
