from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.csrf_cookie_view, name="csrf"),
    path("me/", views.me, name="me"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
]
