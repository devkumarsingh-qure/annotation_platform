const THEME_STORAGE_KEY = "theme";

const USER_TYPES = {
    WORKSPACE_ADMIN: "workspace_admin",
    ANNOTATOR: "annotator",
} as const;

const DEFAULT_PAGE_SIZE = 6;

const VIEWER_MODES = {
    ANNOTATE: "annotate",
    VIEW: "view",
} as const;

const NEW_ANNOTATION_SET_ID = "new-annotation-set";

export {
    THEME_STORAGE_KEY,
    USER_TYPES,
    DEFAULT_PAGE_SIZE,
    VIEWER_MODES,
    NEW_ANNOTATION_SET_ID,
};