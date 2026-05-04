from django.db import models
from annotation_platform.models.workspace import Workspace
from authentication.models.user import User
from dicom_manager.models.patient import Patient
from typing import List, Dict, Any


class Project(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    members = models.ManyToManyField(
        User,
        related_name="projects",
        blank=True,
    )
    patients = models.ManyToManyField(Patient, related_name="projects", blank=True)

    def __str__(self):
        return self.name

    def serialize(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "member_count": self.members.count(),
            "patient_count": self.patients.count(),
        }
