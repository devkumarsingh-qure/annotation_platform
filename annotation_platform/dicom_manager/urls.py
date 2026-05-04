from django.urls import path

from .views.annotations import annotation_set, annotations_for_series
from .views.patients import (
    PatientsViewSet,
    SeriesViewSet,
)

urlpatterns = [
    path(
        "patients/",
        PatientsViewSet.as_view({"get": "list"}),
        name="get_patients",
    ),
    path(
        "patients/<int:pk>/",
        PatientsViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
        name="patient_details",
    ),
    path(
        "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/",
        SeriesViewSet.as_view({"get": "retrieve"}),
        name="get_series",
    ),
    # path(
    #    "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/annotations/",
    #    annotations_for_series,
    #    name="annotations_for_series",
    # ),
    # path(
    #    "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/annotations/<int:annotation_set_id>/",
    #    annotation_set,
    #    name="annotation_set",
    # ),
]
