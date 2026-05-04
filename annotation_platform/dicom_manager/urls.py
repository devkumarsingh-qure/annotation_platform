from django.urls import path

from .views.annotations import annotation_set, annotations_for_series
from .views.patients import (
    PatientsView,
    SeriesView,
)

urlpatterns = [
    path(
        "patients/",
        PatientsView.as_view(),
        name="patients",
    ),
    path(
        "patients/<int:patient_id>/",
        PatientsView.as_view(),
        name="patient",
    ),
    path(
        "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/",
        SeriesView.as_view(),
        name="series",
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
