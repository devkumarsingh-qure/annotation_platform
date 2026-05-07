def validate_dicom(
    PatientID: str,
    StudyInstanceUID: str,
    SeriesInstanceUID: str,
    SopInstanceUID: str,
    Modality: str,
):
    if not PatientID:
        return False, "Missing PatientID"
    if not StudyInstanceUID:
        return False, "Missing StudyInstanceUID"
    if not SeriesInstanceUID:
        return False, "Missing SeriesInstanceUID"
    if not SopInstanceUID:
        return False, "Missing SopInstanceUID"
    if not Modality:
        return False, "Missing Modality"

    return True, ""
