import logging

from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver

from .series import Series
from annotation_platform.utils.upload_file import S3ObjectDeletionError, delete_s3_object

logger = logging.getLogger(__name__)


class AnnotationSet(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_object_key(self):
        user = self.series.study.patient.user
        patient = self.series.study.patient
        study = self.series.study
        series = self.series
        return f"{user.id}/annotation-sets/{patient.id}/studies/{study.id}/series/{series.id}/annotation-sets/{self.id}.json"


@receiver(pre_delete, sender=AnnotationSet)
def _delete_annotation_set_s3_object(sender, instance, **kwargs):
    try:
        key = instance.get_object_key()
    except Exception as e:
        logger.exception(
            "Could not resolve S3 key for annotation set id=%s", instance.pk
        )
        raise S3ObjectDeletionError(
            "Could not resolve storage key for this annotation set."
        ) from e
    try:
        delete_s3_object(key)
    except Exception as e:
        logger.exception(
            "Failed to delete S3 object for annotation set id=%s", instance.pk
        )
        raise S3ObjectDeletionError(
            "Could not delete the annotation set file from storage. "
            "The database row was not removed."
        ) from e
