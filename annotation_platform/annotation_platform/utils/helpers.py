from django.core.paginator import Paginator
from django.db.models import Count
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from annotation_platform.models import ProjectUserPatientsAssignment
from authentication.models.user import User
from annotation_platform.models.project import Project
from dicom_manager.models import Patient
from django.shortcuts import get_object_or_404
from typing import Dict, List, Tuple, Optional


def check_for_admin(user: User) -> None:
    if not user.is_workspace_admin:
        raise PermissionDenied("You are not authorized to perform this action.")


def resolve_projects_for_user(
    user: User, page: int, page_size: int, patient_id: Optional[int] = None
) -> Tuple[List[Project], int]:
    if user.is_workspace_admin:
        queryset = Project.objects.filter(workspace=user.workspace).order_by(
            "-created_at"
        )
        if patient_id:
            queryset = queryset.filter(patients__id=patient_id)
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.page(page)
        return page_obj.object_list, page_obj.paginator.count

    queryset = Project.objects.filter(members=user).order_by("-created_at")
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.page(page)
    return page_obj.object_list, page_obj.paginator.count


def resolve_project_for_user(user: User, project_id: int) -> Project:
    if user.is_workspace_admin:
        return get_object_or_404(Project, id=project_id, workspace=user.workspace)
    return get_object_or_404(Project, id=project_id, members=user)


def assigned_patient_counts_for_project(project: Project) -> Dict[int, int]:
    """User id -> count of patients in ProjectUserPatientsAssignment for this project."""
    rows = (
        ProjectUserPatientsAssignment.objects.filter(project=project)
        .annotate(_n=Count("patients", distinct=True))
        .values_list("user_id", "_n")
    )
    return {uid: n for uid, n in rows}


def resolve_project_member(project: Project, user_id: str) -> User:
    member = project.get_member(user_id)
    if member is None:
        raise Response(
            {"detail": "Member is not on this project."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return member


def resolve_project_patients_for_user(project: Project, user: User) -> List[Patient]:
    if user.is_workspace_admin:
        return project.patients.all()
    project_user_patients_assignment, _ = (
        ProjectUserPatientsAssignment.objects.get_or_create(project=project, user=user)
    )
    return project_user_patients_assignment.patients.all()
