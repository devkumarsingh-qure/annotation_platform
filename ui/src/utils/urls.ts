const API_PATHS = {
    ME: () => {
        return "/me/"
    },
    LOGIN: () => {
        return "/login/"
    },
    LOGOUT: () => {
        return "/logout/"
    },
    UPLOAD: () => {
        return "/upload/"
    },
    PATIENTS: () => {
        return "/patients/"
    },
    STUDIES_FOR_PATIENT: (patient_id: string) => {
        return `/patients/${patient_id}/studies/`
    },
    SERIES: (patient_id: string, study_id: string, series_id: string) => {
        return `/patients/${patient_id}/studies/${study_id}/series/${series_id}/`
    },
    ANNOTATIONS_FOR_SERIES: (patient_id: string, study_id: string, series_id: string) => {
        return `/patients/${patient_id}/studies/${study_id}/series/${series_id}/annotations/`
    },
    ANNOTATION_SET: (patient_id: string, study_id: string, series_id: string, annotationSetId: string) => {
        return `/patients/${patient_id}/studies/${study_id}/series/${series_id}/annotations/${annotationSetId}/`
    }
}

const UI_PATHS = {
    LOGIN: "/login",
    PATIENTS: "/patients",
    PATIENT: "/patients/:patient_id",
    VIEWER: "/viewer/patients/:patient_id/studies/:study_id/series/:series_id",
}

export { API_PATHS, UI_PATHS };