from django.db import models
from authentication.models.user import User
from dicom_manager.models.patient import Patient
from annotation_platform.models.project import Project


class ProjectUserPatientsAssignment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="project_user_patients_assignments",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    patients = models.ManyToManyField(
        Patient, related_name="project_user_patients_assignments"
    )

    def __str__(self):
        return f"{self.user.username} - {self.project.name}"
