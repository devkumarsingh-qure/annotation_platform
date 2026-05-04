from django.db import models
from typing import Dict, Any

import logging
from annotation_platform.models.workspace import Workspace

logger = logging.getLogger(__name__)


class Patient(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # DICOM fields
    PatientID = models.CharField(unique=True, max_length=255)
    PatientName = models.CharField(max_length=255, null=True, blank=True)
    PatientAge = models.CharField(max_length=255, null=True, blank=True)
    PatientSex = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "PatientID"],
                name="unique_patient_id_per_workspace",
            ),
        ]

    def serialize(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "workspace": {
                "id": str(self.workspace.id),
                "name": self.workspace.name,
            },
            "PatientID": self.PatientID,
            "PatientName": self.PatientName,
            "PatientAge": self.PatientAge,
            "PatientSex": self.PatientSex,
            "created_at": self.created_at,
        }

    def get_s3_prefix(self) -> str:
        return f"workspaces/{self.workspace.id}/patients/{self.id}"
