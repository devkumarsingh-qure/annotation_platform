from django.urls import path

from .views.patient import (
    get_patients,
    get_studies_for_patient,
    get_series,
    annotations_for_series,
    annotation_set,
)

urlpatterns = [
    path("patients/", get_patients, name="get_patients"),
    path(
        "patients/<int:patient_id>/studies/",
        get_studies_for_patient,
        name="get_studies_for_patient",
    ),
    path(
        "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/",
        get_series,
        name="get_series",
    ),
    path(
        "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/annotations/",
        annotations_for_series,
        name="annotations_for_series",
    ),
    path(
        "patients/<int:patient_id>/studies/<int:study_id>/series/<int:series_id>/annotations/<int:annotation_set_id>/",
        annotation_set,
        name="annotation_set",
    ),
]
