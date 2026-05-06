from typing import Optional

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.db.models import Q
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from annotation_platform.utils.helpers import check_for_admin
from authentication.models.user import User

from .serializers import LoginSerializer


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
            return Response(user.serialize(), status=status.HTTP_200_OK)
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
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id: Optional[int] = None):
        user: User = request.user
        check_for_admin(user)

        if user_id is None:
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
            users = User.objects.filter(workspace=user.workspace).exclude(
                is_workspace_admin=True
            )
            search = (request.query_params.get("search") or "").strip()
            if search:
                users = users.filter(
                    Q(username__icontains=search) | Q(email__icontains=search)
                )
            active_raw = (request.query_params.get("active") or "").strip().lower()
            if active_raw in ("true", "1", "yes"):
                users = users.filter(is_active=True)
            elif active_raw in ("false", "0", "no"):
                users = users.filter(is_active=False)
            users = users.order_by("-date_joined")
            paginator = Paginator(users, page_size)
            page_obj = paginator.page(page)
            return Response(
                {
                    "page": page,
                    "total": paginator.count,
                    "results": [u.serialize() for u in page_obj.object_list],
                },
                status=status.HTTP_200_OK,
            )

        user = get_object_or_404(User, id=user_id, workspace=user.workspace)
        return Response(user.serialize(), status=status.HTTP_200_OK)

    def post(self, request):
        user: User = request.user
        check_for_admin(user)

        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        email = (request.data.get("email") or "").strip()

        if not username or not password:
            return Response(
                {"detail": "username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                workspace=user.workspace,
                is_workspace_admin=False,
            )
        except IntegrityError:
            return Response(
                {"detail": "A user with that username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            user.serialize(),
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, user_id: int):
        user: User = request.user
        check_for_admin(user)

        user = get_object_or_404(User, id=user_id, workspace=user.workspace)

        is_active = request.data.get("is_active")
        email = request.data.get("email")
        username = request.data.get("username")

        if is_active is not None:
            user.is_active = is_active
        if email is not None:
            user.email = email
        if username is not None:
            user.username = username
        if "password" in request.data:
            raw = request.data.get("password")
            if not isinstance(raw, str):
                return Response(
                    {"detail": "Password must be a string."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            pwd = raw.strip()
            if not pwd:
                return Response(
                    {"detail": "Password cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                validate_password(pwd, user=user)
            except ValidationError as exc:
                msg = (
                    exc.messages[0]
                    if getattr(exc, "messages", None)
                    else "Password does not meet requirements."
                )
                return Response(
                    {"detail": msg},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(pwd)

        user.save()
        return Response(user.serialize(), status=status.HTTP_200_OK)

    def delete(self, request, user_id: int):
        user: User = request.user
        check_for_admin(user)

        user = get_object_or_404(User, id=user_id, workspace=user.workspace)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
