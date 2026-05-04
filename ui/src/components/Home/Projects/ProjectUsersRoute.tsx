import { useContext } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/authContext";
import { isAnnotator } from "../../../utils/roleUi";
import { UI_PATHS } from "../../../utils/urls";

/** Annotators only see project-scoped patients; team management is hidden. */
function ProjectUsersRoute() {
    const { user: me } = useContext(AuthContext);
    const { projectId } = useParams<{ projectId: string }>();
    if (!projectId) {
        return null;
    }
    if (isAnnotator(me?.user_type)) {
        return <Navigate to={UI_PATHS.PROJECT_PATIENTS(projectId)} replace />;
    }
    return <Outlet />;
}

export default ProjectUsersRoute;
