import { USER_TYPES } from "./constants";
import { UI_PATHS } from "./urls";

export function isWorkspaceAdmin(userType: string | undefined): boolean {
    return userType === USER_TYPES.WORKSPACE_ADMIN;
}

export function isAnnotator(userType: string | undefined): boolean {
    return userType === USER_TYPES.ANNOTATOR;
}

/** Workspace-wide Patients nav: workspace admins only (others use project-scoped lists). */
export function showWorkspacePatientsNav(userType: string | undefined): boolean {
    return isWorkspaceAdmin(userType);
}

/** Team & assignments tab inside a project (not for annotators). */
export function showProjectTeamTab(userType: string | undefined): boolean {
    return !isAnnotator(userType);
}

/** Default project sub-route after opening a project from the list or index redirect. */
export function projectPrimaryUiPath(projectId: string, userType: string | undefined): string {
    if (isAnnotator(userType)) {
        return UI_PATHS.PROJECT_PATIENTS(projectId);
    }
    return UI_PATHS.PROJECT_USERS(projectId);
}
