const API_PATHS = {
  CSRF: () => {
    return "/csrf/";
  },
  ME: () => {
    return "/me/";
  },
  LOGIN: () => {
    return "/login/";
  },
  LOGOUT: () => {
    return "/logout/";
  },
  UPLOAD: () => {
    return "/upload/";
  },
  PROJECTS: (
    {
      page,
      page_size,
    }: {
      page: number;
      page_size: number;
    } = {
      page: 0,
      page_size: 0,
    },
    patient_id: string = "",
  ) => {
    return `/projects/?page=${page}&page_size=${page_size}${patient_id ? `&patient_id=${patient_id}` : ""}`;
  },
  PROJECT: (project_id: string) => {
    return `/projects/${project_id}/`;
  },
  PROJECT_USERS: (project_id: string) => {
    return `/projects/${project_id}/users/`;
  },
  PROJECT_USER: (project_id: string, user_id: string) => {
    return `/projects/${project_id}/users/${user_id}/`;
  },
  PROJECT_PATIENTS: (project_id: string) => {
    return `/projects/${project_id}/patients/`;
  },
  PROJECT_USER_PATIENTS: (project_id: string, user_id: string) => {
    return `/projects/${project_id}/users/${user_id}/patients/`;
  },
  USERS: ({
    page,
    page_size,
    search,
    active,
  }: {
    page?: number;
    page_size?: number;
    search?: string;
    /** `"true"` | `"false"` — omit for no filter */
    active?: "true" | "false";
  } = {}) => {
    const qs = new URLSearchParams();
    if (page != null) qs.set("page", String(page));
    if (page_size != null) qs.set("page_size", String(page_size));
    const s = search?.trim();
    if (s) qs.set("search", s);
    if (active === "true" || active === "false") qs.set("active", active);
    const qstr = qs.toString();
    return qstr ? `/users/?${qstr}` : `/users/`;
  },
  USER: (userId: string) => {
    return `/users/${userId}/`;
  },
  PATIENTS: ({
    page,
    page_size,
    search,
    age_range,
    gender,
  }: {
    page: number;
    page_size: number;
    search: string;
    age_range: string;
    gender: string;
  }) => {
    const qs = new URLSearchParams({
      page: String(page),
      page_size: String(page_size),
      search,
      age_range,
      gender,
    });
    return `/patients/?${qs.toString()}`;
  },
  PATIENT: (patientId: string) => {
    return `/patients/${patientId}/`;
  },
  SERIES: (patientId: string, studyId: string, seriesId: string) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/`;
  },
  ANNOTATIONS_FOR_SERIES: (
    projectId: string,
    patientId: string,
    studyId: string,
    seriesId: string,
  ) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/annotations/?project_id=${projectId}`;
  },
  ANNOTATION_SET: (
    projectId: string,
    patientId: string,
    studyId: string,
    seriesId: string,
    annotationSetId: string,
  ) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/annotations/${annotationSetId}/?project_id=${projectId}`;
  },
};

const UI_PATHS = {
  LOGIN: () => {
    return "/login";
  },
  ABOUT: () => {
    return "/about";
  },
  PROJECTS: () => {
    return "/projects";
  },
  PROJECT: (projectId: string) => {
    return `/projects/${projectId}`;
  },
  PROJECT_MEMBERS: (projectId: string) => {
    return `/projects/${projectId}/members`;
  },
  PROJECT_USER: (projectId: string, userId: string) => {
    return `/projects/${projectId}/users/${userId}`;
  },
  PROJECT_USER_PATIENTS: (projectId: string, userId: string) => {
    return `/projects/${projectId}/users/${userId}/patients`;
  },
  PROJECT_PATIENTS: (projectId: string) => {
    return `/projects/${projectId}/patients`;
  },
  PATIENTS: () => {
    return "/patients";
  },
  PATIENT: (patientId: string) => {
    return `/patients/${patientId}`;
  },
  USERS: () => {
    return "/users";
  },
  USER: (userId: string) => {
    return `/users/${userId}`;
  },
  VIEWER: ({
    patientId,
    studyId,
    seriesId,
    projectId,
  }: {
    patientId: string;
    studyId?: string;
    seriesId?: string;
    projectId?: string;
  }) => {
    return `/viewer/${patientId}?${studyId ? `studyId=${studyId}` : ""}${seriesId ? `&seriesId=${seriesId}` : ""}${projectId ? `&projectId=${projectId}` : ""}`;
  },
};

export { API_PATHS, UI_PATHS };
