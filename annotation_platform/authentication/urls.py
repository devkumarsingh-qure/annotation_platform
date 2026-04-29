from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.CsrfCookieView.as_view(), name="csrf"),
    path("me/", views.MeView.as_view(), name="me"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
]
