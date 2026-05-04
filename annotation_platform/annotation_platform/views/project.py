from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from typing import Any, List, Optional

from annotation_platform.models.project import Project
from annotation_platform.utils.helpers import (
    check_for_admin,
    resolve_projects_for_user,
    resolve_project_for_user,
)
from authentication.models.user import User


class ProjectView(APIView):
    permission_classes = [IsAuthenticated()]

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
            projects: List[Project] = resolve_projects_for_user(user)
            return Response(
                [project.serialize() for project in projects],
                status=status.HTTP_200_OK,
            )

        project = resolve_project_for_user(user, project_id)
        return Response(project.serialize(), status=status.HTTP_200_OK)


class ProjectUsersView(APIView):
    permission_classes = [IsAuthenticated()]

    def get(
        self,
        request,
        project_id: int,
        user_id: Optional[str] = None,
    ):
        user: User = request.user
        project: Project = get_object_or_404(
            Project, id=project_id, workspace=user.workspace
        )

        if user_id is None:
            members: List[User] = project.members.all()
            return Response(
                [member.serialize() for member in members],
                status=status.HTTP_200_OK,
            )

        member = get_object_or_404(User, id=user_id, workspace=user.workspace)
        if not project.members.filter(id=member.id).exists():
            return Response(
                {"detail": "Member is not on this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(member.serialize(), status=status.HTTP_200_OK)


class ProjectUserPatientsView(APIView):
    permission_classes = [IsAuthenticated()]

    def get(self, request, project_id: int, user_id: str):
        user: User = request.user
        project: Project = get_object_or_404(
            Project, id=project_id, workspace=user.workspace
        )
        member = get_object_or_404(User, id=user_id, workspace=user.workspace)
        if not project.members.filter(id=member.id).exists():
            return Response(
                {"detail": "Member is not on this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        project_user_patients_assignment: ProjectUserPatientsAssignment = (
            get_object_or_404(
                ProjectUserPatientsAssignment, project=project, user=member
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
        project: Project = get_object_or_404(
            Project, id=project_id, workspace=user.workspace
        )
        member = get_object_or_404(User, id=user_id, workspace=user.workspace)
        if not project.members.filter(id=member.id).exists():
            return Response(
                {"detail": "Member is not on this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        project_user_patients_assignment: ProjectUserPatientsAssignment = (
            ProjectUserPatientsAssignment.objects.get_or_create(
                project=project, user=member
            )
        )
        patient_ids = request.data.get("patient_ids")
        project_user_patients_assignment.patients.add(*patient_ids)

        return Response(
            project_user_patients_assignment.serialize(),
            status=status.HTTP_200_OK,
        )

    def delete(self, request, project_id: int, user_id: str):
        user: User = request.user
        project: Project = get_object_or_404(
            Project, id=project_id, workspace=user.workspace
        )
        member = get_object_or_404(User, id=user_id, workspace=user.workspace)
        if not project.members.filter(id=member.id).exists():
            return Response(
                {"detail": "Member is not on this project."},
                status=status.HTTP_404_NOT_FOUND,
            )
        project_user_patients_assignment: ProjectUserPatientsAssignment = (
            get_object_or_404(
                ProjectUserPatientsAssignment, project=project, user=member
            )
        )

        patient_ids = request.data.get("patient_ids")
        for patient_id in patient_ids:
            patient = get_object_or_404(
                Patient, id=patient_id, workspace=user.workspace
            )
            if not project.patients.filter(id=patient.id).exists():
                return Response(
                    {"detail": "Patient is not on this project."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            project_user_patients_assignment.patients.remove(patient)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPatientsView(APIView):
    """List, link, or unlink patients on a project."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), CanManageProjectPatientLinks()]

    def get(self, request, project_id: int):
        project = get_project_for_user(request.user, project_id)
        if project is None:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            page = int(request.query_params.get("page", "1"))
            page_size = int(request.query_params.get("page_size", "50"))
            if page < 1 or page_size < 1:
                raise ValueError("page and page_size must be positive integers")
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if is_workspace_admin(request.user):
            qs = project.patients.order_by("-created_at")
        else:
            assignment = ProjectUserPatientsAssignment.objects.filter(
                project=project, user=request.user
            ).first()
            if assignment is None:
                qs = Patient.objects.none()
            else:
                qs = assignment.patients.order_by("-created_at")

        paginator = Paginator(qs, page_size)
        page_obj = paginator.page(page)
        serializer = PatientSerializer(page_obj.object_list, many=True)
        return Response(
            {"total_results": paginator.count, "results": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request, project_id: int):
        workspace: Workspace = request.user.workspace
        project = resolve_project_or_404(request.user, project_id)

        patient_ids = request.data.get("patient_ids")
        if not isinstance(patient_ids, list):
            return Response(
                {"detail": "patient_ids is required and must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw_ids = [str(x) for x in patient_ids if x not in (None, "")]
        if not raw_ids:
            return Response(
                {"detail": "patient_ids cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        added: List[dict[str, str]] = []
        skipped: List[dict[str, Any]] = []

        for pid in raw_ids:
            try:
                candidate = Patient.objects.get(pk=pid)
            except Patient.DoesNotExist:
                skipped.append({"id": pid, "reason": "not_found"})
                continue
            if candidate.workspace_id != workspace.id:
                skipped.append({"id": str(pid), "reason": "wrong_workspace"})
                continue
            patient = candidate
            if project.patients.filter(id=patient.id).exists():
                skipped.append({"id": str(patient.id), "reason": "already_linked"})
                continue
            project.patients.add(patient)
            added.append({"id": str(patient.id), "PatientID": patient.PatientID})

        st = status.HTTP_201_CREATED if added else status.HTTP_200_OK
        return Response({"added": added, "skipped": skipped}, status=st)

    def delete(self, request, project_id: int):
        workspace: Workspace = request.user.workspace
        project = resolve_project_or_404(request.user, project_id)

        patient_ids = request.data.get("patient_ids")
        if not isinstance(patient_ids, list):
            return Response(
                {
                    "detail": "patient_ids is required and must be a non-empty list "
                    "(bulk DELETE on /projects/<id>/patients/)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw_ids = [str(x) for x in patient_ids if x not in (None, "")]
        if not raw_ids:
            return Response(
                {"detail": "patient_ids cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        removed: List[dict[str, str]] = []
        skipped: List[dict[str, Any]] = []

        for pid in raw_ids:
            try:
                candidate = Patient.objects.get(pk=pid)
            except Patient.DoesNotExist:
                skipped.append({"id": pid, "reason": "not_found"})
                continue
            if candidate.workspace_id != workspace.id:
                skipped.append({"id": str(pid), "reason": "wrong_workspace"})
                continue
            if not project.patients.filter(id=candidate.id).exists():
                skipped.append({"id": str(candidate.id), "reason": "not_linked"})
                continue
            for assignment in ProjectUserPatientsAssignment.objects.filter(
                project=project
            ):
                assignment.patients.remove(candidate)
            project.patients.remove(candidate)
            removed.append({"id": str(candidate.id), "PatientID": candidate.PatientID})

        return Response(
            {"removed": removed, "skipped": skipped}, status=status.HTTP_200_OK
        )
