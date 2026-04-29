import type { ViewerMode } from "../types/Viewer"

const API_PATHS = {
    CSRF: () => {
        return "/csrf/"
    },
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
    PATIENTS: ({
        page,
        page_size
    }: {
        page: number;
        page_size: number;
    }) => {
        return `/patients/?page=${page}&page_size=${page_size}`
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
    LOGIN: () => {
        return "/login/"
    },
    PATIENTS: () => {
        return "/worklist/"
    },
    PATIENT: ({ params }: { params: { patient_id: string } }) => {
        const { patient_id } = params;
        return `${UI_PATHS.PATIENTS()}${patient_id}/`
    },
    VIEWER: ({ params, query }: { params: { patient_id: string; study_id: string; series_id: string }; query: { mode: ViewerMode } }) => {
        const { patient_id, study_id, series_id } = params;
        const { mode } = query;
        return `/viewer/${patient_id}/studies/${study_id}/series/${series_id}/?mode=${mode}`
    }
}

export { API_PATHS, UI_PATHS };