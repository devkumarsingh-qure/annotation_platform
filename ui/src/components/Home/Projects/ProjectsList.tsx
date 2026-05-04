import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectType } from "../../../types/Workspace";
import AddProject from "./AddProject";
import apiClient from "../../../utils/apiClient";
import { toastError } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import { isWorkspaceAdmin, projectPrimaryUiPath } from "../../../utils/roleUi";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

function ProjectsList() {
    const { user: me } = useContext(AuthContext);

    const [projects, setProjects] = useState<ProjectType[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const canCreateProject = isWorkspaceAdmin(me?.user_type);

    useEffect(() => {
        let cancelled = false;
        /* eslint-disable react-hooks/set-state-in-effect -- loading flags before fetch */
        setLoading(true);
        setLoadError(null);
        /* eslint-enable react-hooks/set-state-in-effect */
        apiClient
            .get<ProjectType[]>(API_PATHS.PROJECTS())
            .then((response) => {
                if (!cancelled) setProjects(response.data);
            })
            .catch(() => {
                if (!cancelled) {
                    const msg = "Could not load projects.";
                    setLoadError(msg);
                    toastError(msg);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleCreated = (project: ProjectType) => {
        setProjects((prev) => [project, ...prev]);
    };

    return (
        <div className="flex w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8">
            {createOpen && canCreateProject ? (
                <AddProject
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onCreated={handleCreated}
                />
            ) : (
                <>
                    <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                                Workspace
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                                Projects
                            </h1>
                            <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                                Organize annotation work, collaborators, and linked patients in one
                                place.
                            </p>
                        </div>
                        {canCreateProject ? (
                            <AddProject
                                open={createOpen}
                                onOpenChange={setCreateOpen}
                                onCreated={handleCreated}
                            />
                        ) : null}
                    </header>

                    {loadError ? (
                        <div
                            className="rounded-xl border border-[var(--danger)]/35 bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] px-4 py-3 text-sm text-[var(--danger)]"
                            role="alert"
                        >
                            {loadError}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"
                                />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--surface)] px-8 py-16 text-center backdrop-blur-[10px]">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]/80 text-2xl text-[var(--accent)]">
                                ◇
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--text)]">No projects yet</h2>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                                {canCreateProject
                                    ? "Create your first project to start assigning users and patients."
                                    : "No projects are available yet. Ask a workspace admin to create one."}
                            </p>
                        </div>
                    ) : (
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <li key={project.id}>
                                    <Link
                                        to={projectPrimaryUiPath(project.id, me?.user_type)}
                                        className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_12px_32px_-18px_color-mix(in_srgb,var(--text)_18%,transparent)] backdrop-blur-[12px] transition hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] hover:shadow-[0_20px_40px_-20px_color-mix(in_srgb,var(--accent)_22%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--text)] group-hover:text-[var(--accent-strong)]">
                                                {project.name}
                                            </h2>
                                            <span className="shrink-0 text-[var(--muted)] opacity-0 transition group-hover:opacity-100">
                                                →
                                            </span>
                                        </div>
                                        {project.description ? (
                                            <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                                                {project.description}
                                            </p>
                                        ) : (
                                            <p className="mb-4 flex-1 text-sm italic text-[var(--muted)]/70">
                                                No description
                                            </p>
                                        )}
                                        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[var(--border)]/80 pt-4 text-xs text-[var(--muted)]">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-soft)] px-2 py-1 font-medium text-[var(--text)]">
                                                <span className="text-[var(--accent)]">●</span>
                                                {project.member_count}{" "}
                                                {project.member_count === 1 ? "user" : "users"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-soft)] px-2 py-1 font-medium text-[var(--text)]">
                                                <span className="text-[var(--accent)]">●</span>
                                                {project.patient_count}{" "}
                                                {project.patient_count === 1 ? "patient" : "patients"}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--muted)]/80">
                                            Updated {formatDate(project.updated_at)}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}

export default ProjectsList;
