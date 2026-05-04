from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.CsrfCookieView.as_view(), name="csrf"),
    path("me/", views.MeView.as_view(), name="me"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("users/", views.WorkspaceUsersView.as_view(), name="users"),
    path("users/<int:user_id>/", views.WorkspaceUserView.as_view(), name="user"),
]
