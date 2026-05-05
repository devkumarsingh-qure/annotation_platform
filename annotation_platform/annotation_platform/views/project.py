from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from typing import List, Optional

from dicom_manager.models.patient import Patient
from annotation_platform.models.project import Project
from annotation_platform.utils.helpers import (
    assigned_patient_counts_for_project,
    check_for_admin,
    resolve_project_member,
    resolve_project_patients_for_user,
    resolve_projects_for_user,
    resolve_project_for_user,
)
from authentication.models import User
from annotation_platform.models import ProjectUserPatientsAssignment, Workspace


class ProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user: User = request.user
        check_for_admin(user)

        workspace: Workspace = user.workspace
        name = request.data.get("name")
        description = request.data.get("description")

        project: Project = Project.objects.create(
            workspace=workspace,
            name=name,
            description=description,
        )

        return Response(project.serialize(), status=status.HTTP_201_CREATED)

    def get(self, request, project_id: Optional[int] = None):
        user: User = request.user

        if project_id is None:
            try:
                page = int(request.query_params.get("page"))
                page_size = int(request.query_params.get("page_size"))
                if page < 1 or page_size < 1:
                    raise ValueError("page and page_size must be positive integers")
            except Exception as e:
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            patient_id = request.query_params.get("patient_id", None)
            projects, total = resolve_projects_for_user(
                user, page, page_size, patient_id
            )
            return Response(
                {
                    "total": total,
                    "results": [project.serialize() for project in projects],
                },
                status=status.HTTP_200_OK,
            )

        project = resolve_project_for_user(user, project_id)
        return Response(project.serialize(), status=status.HTTP_200_OK)


class ProjectUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        project_id: int,
        user_id: Optional[str] = None,
    ):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        counts = assigned_patient_counts_for_project(project)

        if user_id is None:
            members: List[User] = project.members.all()
            return Response(
                [
                    m.serialize_for_project(counts.get(m.pk, 0))
                    for m in members
                ],
                status=status.HTTP_200_OK,
            )

        member = resolve_project_member(project, user_id)
        return Response(
            member.serialize_for_project(counts.get(member.pk, 0)),
            status=status.HTTP_200_OK,
        )

    def post(self, request, project_id: int):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        user_ids = request.data.get("user_ids")
        project.add_members(user_ids)
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, project_id: int):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        user_ids = request.data.get("user_ids")
        project.remove_members(user_ids)
        return Response(status=status.HTTP_200_OK)


class ProjectUserPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id: int, user_id: str):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        member = resolve_project_member(project, user_id)

        project_user_patients_assignment, _ = (
            ProjectUserPatientsAssignment.objects.get_or_create(
                project=project, user=member
            )
        )
        assigned_patients: List[Patient] = (
            project_user_patients_assignment.patients.all()
        )
        return Response(
            [patient.serialize() for patient in assigned_patients],
            status=status.HTTP_200_OK,
        )

    def post(self, request, project_id: int, user_id: str):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        member = resolve_project_member(project, user_id)

        project_user_patients_assignment, _ = (
            ProjectUserPatientsAssignment.objects.get_or_create(
                project=project, user=member
            )
        )
        patient_ids = request.data.get("patient_ids")
        project_user_patients_assignment.assign_patients(patient_ids)
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, project_id: int, user_id: str):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        member = resolve_project_member(project, user_id)

        project_user_patients_assignment, _ = (
            ProjectUserPatientsAssignment.objects.get_or_create(
                project=project, user=member
            )
        )
        patient_ids = request.data.get("patient_ids")
        project_user_patients_assignment.unassign_patients(patient_ids)
        return Response(status=status.HTTP_200_OK)


class ProjectPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id: int):
        user: User = request.user

        project = resolve_project_for_user(user, project_id)
        patients = resolve_project_patients_for_user(project, user)
        return Response(
            [patient.serialize() for patient in patients],
            status=status.HTTP_200_OK,
        )

    def post(self, request, project_id: int):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        patient_ids = request.data.get("patient_ids")
        project.add_patients(patient_ids)
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, project_id: int):
        user: User = request.user
        check_for_admin(user)

        project = resolve_project_for_user(user, project_id)
        patient_ids = request.data.get("patient_ids")
        project.remove_patients(patient_ids)
        return Response(status=status.HTTP_200_OK)
