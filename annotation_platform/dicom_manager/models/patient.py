from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete
from django.dispatch import receiver

import logging
from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    delete_s3_prefix,
)

logger = logging.getLogger(__name__)


class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    PatientID = models.CharField(unique=True, max_length=255)
    PatientName = models.CharField(max_length=255, null=True, blank=True)
    PatientAge = models.CharField(max_length=255, null=True, blank=True)
    PatientSex = models.CharField(max_length=255, null=True, blank=True)

    def get_dicomp10_s3_prefix(self):
        return f"{self.user.id}/dicomp10/{self.id}"

    def get_annotation_sets_s3_prefix(self):
        return f"{self.user.id}/annotation-sets/{self.id}"


@receiver(pre_delete, sender=Patient)
def delete_patient_and_related_objects(sender, instance, **kwargs):
    try:
        patient_dicomp10_s3_prefix = instance.get_dicomp10_s3_prefix()
        delete_s3_prefix(patient_dicomp10_s3_prefix)
    except Exception as e:
        logger.exception(
            f"Failed to delete patient and related objects id={instance.pk}", e
        )
        raise S3ObjectDeletionError(
            f"Failed to delete patient and related objects id={instance.pk}"
        ) from e
