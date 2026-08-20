"""
URL configuration for annotation_platform project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from .views.health import health
from .views.local_media import serve_local_media
from .views.upload import UploadView
from .views.project import (
    ProjectView,
    ProjectUsersView,
    ProjectPatientsView,
    ProjectUserPatientsView,
)

urlpatterns = [
    path("health/", health, name="health"),
    path("admin/", admin.site.urls),
    path("", include("authentication.urls")),
    path(
        "projects/<int:project_id>/users/<str:user_id>/patients/",
        ProjectUserPatientsView.as_view(),
        name="project-user-patients",
    ),
    path(
        "projects/<int:project_id>/users/<str:user_id>/",
        ProjectUsersView.as_view(),
        name="project-user",
    ),
    path(
        "projects/<int:project_id>/users/",
        ProjectUsersView.as_view(),
        name="project-users",
    ),
    path(
        "projects/<int:project_id>/patients/",
        ProjectPatientsView.as_view(),
        name="project-patients",
    ),
    path("projects/<int:project_id>/", ProjectView.as_view(), name="project"),
    path("projects/", ProjectView.as_view(), name="projects"),
    path("upload/", UploadView.as_view(), name="upload"),
    path("", include("dicom_manager.urls")),
]

if settings.DEBUG and settings.STORAGE_BACKEND == "local":
    urlpatterns += static(
        settings.MEDIA_URL,
        view=serve_local_media,
        document_root=settings.MEDIA_ROOT,
    )
