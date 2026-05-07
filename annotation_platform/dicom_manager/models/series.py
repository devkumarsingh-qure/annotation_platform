from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.db import models
import logging

from .study import Study
from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    upload_file,
    delete_s3_object,
)

logger = logging.getLogger(__name__)


class Series(models.Model):
    study = models.ForeignKey(Study, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    SeriesInstanceUID = models.CharField(unique=True, max_length=255)
    SeriesDescription = models.CharField(max_length=255, null=True, blank=True)
    SeriesNumber = models.CharField(max_length=255, null=True, blank=True)
    Modality = models.CharField(max_length=255, null=True, blank=True)

    def serialize(self):
        return {
            "id": str(self.id),
            "study_id": str(self.study.id),
            "SeriesInstanceUID": self.SeriesInstanceUID,
            "SeriesDescription": self.SeriesDescription,
            "SeriesNumber": self.SeriesNumber,
            "Modality": self.Modality,
            "created_at": self.created_at,
            "total_instances": self.get_total_instances(),
        }

    def get_total_instances(self):
        return self.instance_set.count()

    def get_s3_prefix(self):
        study = self.study
        study_s3_prefix = study.get_s3_prefix()
        return f"{study_s3_prefix}/series/{self.id}"

    def get_metadata_object_key(self):
        series_s3_prefix = self.get_s3_prefix()
        return f"{series_s3_prefix}/metadata/metadata.json"

    def upload_metadata(self, local_path):
        key = self.get_metadata_object_key()
        upload_file(local_path, key, content_type="application/json")


@receiver(pre_delete, sender=Series)
def delete_s3_objects(sender, instance: Series, **kwargs):
    try:
        metadata_key = instance.get_metadata_object_key()
        delete_s3_object(metadata_key)
    except Exception as e:
        logger.exception(f"Failed to delete S3 object for instance id={instance.pk}", e)
        raise S3ObjectDeletionError(
            f"Failed to delete S3 object for instance id={instance.pk}"
        ) from e
