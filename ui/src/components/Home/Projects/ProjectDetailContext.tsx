import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ProjectDetailType } from "../../../types/Workspace";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";

type ProjectDetailContextValue = {
    project: ProjectDetailType | null;
    setProject: React.Dispatch<React.SetStateAction<ProjectDetailType | null>>;
    loading: boolean;
    error: string | null;
    projectId: string;
    refetch: () => void;
};

const ProjectDetailContext = createContext<ProjectDetailContextValue | null>(null);

export function ProjectDetailProvider({
    projectId,
    children,
}: {
    projectId: string;
    children: ReactNode;
}) {
    const [project, setProject] = useState<ProjectDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(() => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        apiClient
            .get<ProjectDetailType>(API_PATHS.PROJECT(projectId))
            .then((res) => setProject(res.data))
            .catch(() => {
                setError("Project not found or you do not have access.");
                setProject(null);
            })
            .finally(() => setLoading(false));
    }, [projectId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const value: ProjectDetailContextValue = {
        project,
        setProject,
        loading,
        error,
        projectId,
        refetch,
    };

    return (
        <ProjectDetailContext.Provider value={value}>{children}</ProjectDetailContext.Provider>
    );
}

export function useProjectDetail() {
    const ctx = useContext(ProjectDetailContext);
    if (!ctx) {
        throw new Error("useProjectDetail must be used within ProjectDetailProvider");
    }
    return ctx;
}
