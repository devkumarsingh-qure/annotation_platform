from django.db import models
from django.shortcuts import get_object_or_404
from authentication.models.user import User
from dicom_manager.models.patient import Patient
from annotation_platform.models.project import Project
from typing import List
from django.db import transaction


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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_user_patients_assignment",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.project.name}"

    def assign_patient(self, patient_id: str):
        patient = get_object_or_404(
            Patient, id=patient_id, workspace=self.project.workspace
        )
        self.patients.add(patient)
        self.save()

    def unassign_patient(self, patient_id: str):
        patient = self.patients.get(id=patient_id)
        self.patients.remove(patient)
        self.save()

    def assign_patients(self, patient_ids: List[str]):
        with transaction.atomic():
            for patient_id in patient_ids:
                self.assign_patient(patient_id)

    def unassign_patients(self, patient_ids: List[str]):
        with transaction.atomic():
            for patient_id in patient_ids:
                self.unassign_patient(patient_id)
