import logging

from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver

from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    delete_s3_object,
    get_presigned_url,
)
from authentication.models.user import User

from .series import Series

logger = logging.getLogger(__name__)


class SegmentationMask(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey("annotation_platform.Project", on_delete=models.CASCADE)
    series = models.ForeignKey(Series, on_delete=models.CASCADE)
    label = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def get_object_key(self):
        return (
            f"{self.series.get_s3_prefix()}/segmentation-masks/"
            f"{self.id}/segmentation.dcm"
        )

    def serialize(self, include_urls=False):
        payload = {
            "id": str(self.id),
            "label": self.label,
            "updated_at": self.updated_at,
        }
        if include_urls:
            payload["url"] = get_presigned_url(self.get_object_key(), 1)
        return payload


@receiver(pre_delete, sender=SegmentationMask)
def delete_segmentation_mask_objects(sender, instance: SegmentationMask, **kwargs):
    try:
        delete_s3_object(instance.get_object_key())
    except Exception as error:
        logger.exception(
            "Failed to delete S3 objects for segmentation mask id=%s",
            instance.pk,
        )
        raise S3ObjectDeletionError(
            f"Failed to delete S3 objects for segmentation mask id={instance.pk}"
        ) from error
