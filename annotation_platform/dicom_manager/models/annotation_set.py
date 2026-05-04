import logging

from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver

from .series import Series
from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    delete_s3_object,
    get_presigned_url,
)
from authentication.models.user import User

logger = logging.getLogger(__name__)


class AnnotationSet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "url": get_presigned_url(self.get_object_key(), 1),
            "created_at": self.created_at,
        }

    def get_object_key(self):
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        patient_s3_prefix = patient.get_s3_prefix()
        return f"{patient_s3_prefix}/studies/{study.id}/series/{series.id}/annotation-sets/{self.id}.json"


@receiver(pre_delete, sender=AnnotationSet)
def delete_annotation_set_s3_object(sender, instance: AnnotationSet, **kwargs):
    try:
        key = instance.get_object_key()
        delete_s3_object(key)
    except Exception as e:
        logger.exception(
            f"Failed to delete S3 object for annotation set id={instance.pk}", e
        )
        raise S3ObjectDeletionError(
            f"Failed to delete S3 object for annotation set id={instance.pk}"
        ) from e
