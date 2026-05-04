import { useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/authContext";
import { projectPrimaryUiPath } from "../../../utils/roleUi";
import { UI_PATHS } from "../../../utils/urls";

function ProjectDefaultRedirect() {
    const { user: me } = useContext(AuthContext);
    const { projectId } = useParams<{ projectId: string }>();
    if (!projectId) {
        return <Navigate to={UI_PATHS.PROJECTS()} replace />;
    }
    return <Navigate to={projectPrimaryUiPath(projectId, me?.user_type)} replace />;
}

export default ProjectDefaultRedirect;
