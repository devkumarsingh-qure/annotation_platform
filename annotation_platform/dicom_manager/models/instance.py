from django.db import models
from django.conf import settings
from django.db.models.signals import pre_delete
from django.dispatch import receiver
import logging
from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    delete_s3_object,
)
from .series import Series

logger = logging.getLogger(__name__)


class Instance(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    SOPInstanceUID = models.CharField(unique=True, max_length=255)
    InstanceNumber = models.CharField(max_length=255, null=True, blank=True)
    NumberOfFrames = models.CharField(max_length=255, null=True, blank=True)

    def get_object_key(self):
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        patient_s3_prefix = patient.get_s3_prefix()
        return f"{patient_s3_prefix}/studies/{study.id}/series/{series.id}/instances/{self.id}.dcm"


@receiver(pre_delete, sender=Instance)
def delete_instance_s3_object(sender, instance: Instance, **kwargs):
    try:
        key = instance.get_object_key()
        delete_s3_object(key)
    except Exception as e:
        logger.exception(f"Failed to delete S3 object for instance id={instance.pk}", e)
        raise S3ObjectDeletionError(
            f"Failed to delete S3 object for instance id={instance.pk}"
        ) from e
