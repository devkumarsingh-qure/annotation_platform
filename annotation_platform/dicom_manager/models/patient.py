from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    PatientID = models.CharField(unique=True, max_length=255)
    PatientName = models.CharField(max_length=255, null=True, blank=True)
    PatientAge = models.CharField(max_length=255, null=True, blank=True)
    PatientSex = models.CharField(max_length=255, null=True, blank=True)
