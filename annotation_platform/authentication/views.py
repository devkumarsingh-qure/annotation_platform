from typing import Optional
from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.db import IntegrityError
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
            users = (
                User.objects.filter(workspace=user.workspace)
                .exclude(pk=user.pk)
                .order_by("username")
            )
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
