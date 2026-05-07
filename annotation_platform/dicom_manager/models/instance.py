from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
import logging
from annotation_platform.utils.upload_file import (
    S3ObjectDeletionError,
    delete_s3_object,
    upload_file,
    download_file,
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

    def get_p10_object_key(self):
        series = self.series
        series_s3_prefix = series.get_s3_prefix()
        return f"{series_s3_prefix}/instances/{self.id}/p10/{self.id}.dcm"

    def get_dicomweb_object_key(self, frame_number: int):
        series = self.series
        series_s3_prefix = series.get_s3_prefix()
        return f"{series_s3_prefix}/instances/{self.id}/frames/{frame_number}.mht"

    def upload_p10_to_s3(
        self,
        local_path,
    ):
        key = self.get_p10_object_key()
        upload_file(local_path, key, content_type="application/dicom")

    def download_p10_to_local(self, destination):
        key = self.get_p10_object_key()
        download_file(key, destination)

    def upload_dicomweb_to_s3(self, local_path, frame_number):
        key = self.get_dicomweb_object_key(frame_number)
        upload_file(local_path, key, content_type="multipart/related")


@receiver(pre_delete, sender=Instance)
def delete_s3_objects(sender, instance: Instance, **kwargs):
    try:
        p10_key = instance.get_p10_object_key()
        delete_s3_object(p10_key)

        number_of_frames = (
            int(instance.NumberOfFrames) if instance.NumberOfFrames else 1
        )
        for frame_number in range(1, number_of_frames + 1):
            dicomweb_key = instance.get_dicomweb_object_key(frame_number)
            delete_s3_object(dicomweb_key)

    except Exception as e:
        logger.exception(f"Failed to delete S3 object for instance id={instance.pk}", e)
        raise S3ObjectDeletionError(
            f"Failed to delete S3 object for instance id={instance.pk}"
        ) from e
