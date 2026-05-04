from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from typing import List, Tuple

from authentication.models.user import User
from pydicom.dataelem import DataElement

from dicom_manager.models.patient import Patient


def dicom_value_to_str(raw) -> str | None:
    """Coerce pydicom DataElement (or a raw value) to str/None; PersonName and similar become JSON- and ORM-safe."""
    if raw is None:
        return None
    if isinstance(raw, DataElement):
        if getattr(raw, "value", None) in (None, ""):
            return None
        val = raw.value
    else:
        val = raw
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def resolve_patients_for_user(
    user: User, page: int, page_size: int
) -> Tuple[List[Patient], int]:
    if user.is_workspace_admin:
        queryset = Patient.objects.filter(workspace=user.workspace).order_by(
            "-created_at"
        )
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.page(page)
        return page_obj.object_list, page_obj.paginator.count

    queryset = (
        Patient.objects.filter(
            workspace=user.workspace,
            project_user_patients_assignments__user=user,
        )
        .distinct()
        .order_by("-created_at")
    )
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.page(page)
    return page_obj.object_list, page_obj.paginator.count


def resolve_patient_for_user(user: User, patient_id: int) -> Patient:
    if user.is_workspace_admin:
        patient = get_object_or_404(Patient, id=patient_id, workspace=user.workspace)
        return patient

    patient = get_object_or_404(
        Patient,
        id=patient_id,
        workspace=user.workspace,
        project_user_patients_assignments__user=user,
    )
    return patient
