from rest_framework.response import Response
from rest_framework import status
from authentication.models.user import User


def check_for_admin(user: User) -> Response:
    if not user.is_workspace_admin:
        return Response(
            {"detail": "You are not authorized to perform this action."},
            status=status.HTTP_403_FORBIDDEN,
        )


def resolve_projects_for_user(user: User) -> List[Project]:
    if user.is_workspace_admin:
        return Project.objects.filter(workspace=user.workspace)
    return Project.objects.filter(members=user)


def resolve_project_for_user(user: User, project_id: int) -> Project:
    if user.is_workspace_admin:
        return get_object_or_404(Project, id=project_id, workspace=user.workspace)
    return get_object_or_404(Project, id=project_id, members=user)
