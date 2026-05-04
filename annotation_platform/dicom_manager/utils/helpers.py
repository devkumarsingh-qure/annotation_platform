from pydicom.dataelem import DataElement


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
