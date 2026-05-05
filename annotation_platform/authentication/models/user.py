from django.contrib.auth.models import AbstractUser
from django.db import models
from typing import Dict, Any
from annotation_platform.models.workspace import Workspace


class User(AbstractUser):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_workspace_admin = models.BooleanField(default=False)

    def serialize(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "workspace": {
                "id": str(self.workspace.id),
                "name": self.workspace.name,
            },
            "is_workspace_admin": self.is_workspace_admin,
            "is_active": self.is_active,
            "date_joined": self.date_joined,
            "last_login": self.last_login,
        }

    def serialize_for_project(self, assigned_patient_count: int) -> Dict[str, Any]:
        payload = self.serialize()
        payload["assigned_patient_count"] = assigned_patient_count
        return payload
