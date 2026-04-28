from django.db import models
from .patient import Patient


class Study(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    StudyInstanceUID = models.CharField(unique=True, max_length=255)
    AccessionNumber = models.CharField(max_length=255, null=True, blank=True)
    StudyDescription = models.CharField(max_length=255, null=True, blank=True)
