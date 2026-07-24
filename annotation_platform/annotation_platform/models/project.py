from django.db import models
from django.shortcuts import get_object_or_404
from annotation_platform.models.project_user_patients_assignment import (
    ProjectUserPatientsAssignment,
)
from dicom_manager.models.annotation_set import AnnotationSet
from dicom_manager.models.segmentation_mask import SegmentationMask
from annotation_platform.models.workspace import Workspace
from authentication.models.user import User
from dicom_manager.models.patient import Patient
from typing import List, Dict, Any
from django.db import transaction


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

    def get_member(self, user_id: str) -> User:
        return self.members.get(id=user_id)

    def add_member(self, user_id: str):
        user: User = get_object_or_404(User, id=user_id, workspace=self.workspace)
        if user.is_workspace_admin:
            return
        if not user.is_active:
            return
        self.members.add(user)
        self.save()

    def remove_member(self, user_id: str):
        with transaction.atomic():
            user = self.get_member(user_id)
            ProjectUserPatientsAssignment.objects.filter(
                project=self, user=user
            ).delete()
            AnnotationSet.objects.filter(project=self, user=user).delete()
            SegmentationMask.objects.filter(project=self, user=user).delete()
            self.members.remove(user)

    def add_members(self, user_ids: List[str]):
        with transaction.atomic():
            for user_id in user_ids:
                self.add_member(user_id)

    def remove_members(self, user_ids: List[str]):
        with transaction.atomic():
            for user_id in user_ids:
                self.remove_member(user_id)

    def get_patient(self, patient_id: str) -> Patient:
        return self.patients.get(id=patient_id)

    def add_patient(self, patient_id: str):
        patient = get_object_or_404(Patient, id=patient_id, workspace=self.workspace)
        self.patients.add(patient)
        self.save()

    def remove_patient(self, patient_id: str):
        patient = self.get_patient(patient_id)
        self.patients.remove(patient)
        self.save()

    def add_patients(self, patient_ids: List[str]):
        with transaction.atomic():
            for patient_id in patient_ids:
                self.add_patient(patient_id)

    def remove_patients(self, patient_ids: List[str]):
        with transaction.atomic():
            for patient_id in patient_ids:
                self.remove_patient(patient_id)
