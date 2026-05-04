from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from annotation_platform.utils.permissions.user import CanCreateUsers, CanViewUsers
from authentication.models.user import User
from authentication.utils.user_types import UserType

from .serializers import LoginSerializer


def _workspace_user_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email or "",
        "user_type": user.user_type,
        "is_active": user.is_active,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
    }


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class MeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        if user.is_authenticated:
            return Response(
                {
                    "is_authenticated": True,
                    "username": user.username,
                    "workspace": {
                        "name": user.workspace.name,
                    },
                    "user_type": user.user_type,
                }
            )
        return Response(
            {"is_authenticated": False}, status=status.HTTP_401_UNAUTHORIZED
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response(
                {
                    "is_authenticated": True,
                    "username": request.user.username,
                }
            )
        return Response(
            {"is_authenticated": False}, status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"is_authenticated": False})


class WorkspaceUsersView(APIView):
    """List and create users in the caller's workspace."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), CanCreateUsers()]
        return [IsAuthenticated(), CanViewUsers()]

    def get(self, request):
        users = (
            User.objects.filter(workspace=request.user.workspace)
            .order_by("username")
            .select_related("workspace")
        )
        return Response([_workspace_user_payload(u) for u in users])

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        email = (request.data.get("email") or "").strip()
        user_type = request.data.get("user_type")

        if not username or not password:
            return Response(
                {"detail": "username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_type not in [t.value for t in UserType]:
            return Response(
                {"detail": "Invalid user_type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                workspace=request.user.workspace,
                user_type=user_type,
            )
        except IntegrityError:
            return Response(
                {"detail": "A user with that username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            _workspace_user_payload(user),
            status=status.HTTP_201_CREATED,
        )


class WorkspaceUserView(APIView):
    """Get a single user in the caller's workspace (same access as list)."""

    permission_classes = [IsAuthenticated, CanViewUsers]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id, workspace=request.user.workspace)
        return Response(_workspace_user_payload(user))
