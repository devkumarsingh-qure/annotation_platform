from django.db import models
from typing import Dict, Any

import logging
from annotation_platform.models.workspace import Workspace

logger = logging.getLogger(__name__)


class Patient(models.Model):
    EDITABLE_DICOM_FIELDS = (
        "PatientID",
        "PatientName",
        "PatientAge",
        "PatientSex",
    )

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

    def update_dicom_fields(self, data: Dict[str, Any]) -> list[str]:
        changed_fields: list[str] = []

        for field in self.EDITABLE_DICOM_FIELDS:
            if field not in data:
                continue

            raw_value = data.get(field)
            value = None if raw_value is None else str(raw_value).strip()

            if field == "PatientID" and not value:
                raise ValueError("Patient ID is required.")

            if field != "PatientID" and value == "":
                value = None

            if value is not None and len(value) > 255:
                raise ValueError(f"{field} must be 255 characters or fewer.")

            if getattr(self, field) != value:
                setattr(self, field, value)
                changed_fields.append(field)

        return changed_fields

    def get_s3_prefix(self) -> str:
        return f"workspaces/{self.workspace.id}/patients/{self.id}"
