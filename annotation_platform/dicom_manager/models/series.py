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
