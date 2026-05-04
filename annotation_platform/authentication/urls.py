from django.urls import path

from authentication.views import (
    CsrfCookieView,
    MeView,
    LoginView,
    LogoutView,
    WorkspaceUsersView,
)

urlpatterns = [
    path("csrf/", CsrfCookieView.as_view(), name="csrf"),
    path("me/", MeView.as_view(), name="me"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("users/", WorkspaceUsersView.as_view(), name="users"),
    path("users/<int:user_id>/", WorkspaceUsersView.as_view(), name="user"),
]
