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
  PROJECTS: ({ page, page_size }: { page: number; page_size: number }) => {
    return `/projects/?page=${page}&page_size=${page_size}`;
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
  USERS: ({ page, page_size }: { page: number; page_size: number }) => {
    return `/users/?page=${page}&page_size=${page_size}`;
  },
  USER: (userId: string) => {
    return `/users/${userId}/`;
  },
  PATIENTS: ({ page, page_size }: { page: number; page_size: number }) => {
    return `/patients/?page=${page}&page_size=${page_size}`;
  },
  PATIENT: (patientId: string) => {
    return `/patients/${patientId}/`;
  },
  SERIES: (patientId: string, studyId: string, seriesId: string) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/`;
  },
  ANNOTATIONS_FOR_SERIES: (
    patientId: string,
    studyId: string,
    seriesId: string,
  ) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/annotations/`;
  },
  ANNOTATION_SET: (
    patientId: string,
    studyId: string,
    seriesId: string,
    annotationSetId: string,
  ) => {
    return `/patients/${patientId}/studies/${studyId}/series/${seriesId}/annotations/${annotationSetId}/`;
  },
};

const UI_PATHS = {
  LOGIN: () => {
    return "/login";
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
    mode,
  }: {
    patientId: string;
    studyId: string | number;
    seriesId: string | number;
    mode: string;
  }) => {
    return `/viewer/${patientId}/studies/${studyId}/series/${seriesId}/?mode=${encodeURIComponent(mode)}`;
  },
};

export { API_PATHS, UI_PATHS };
