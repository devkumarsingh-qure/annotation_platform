import { useContext } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/authContext";
import { ProjectDetailProvider, useProjectDetail } from "./ProjectDetailContext";
import { showProjectTeamTab } from "../../../utils/roleUi";
import { UI_PATHS } from "../../../utils/urls";

function formatDateTime(iso: string) {
    try {
        return new Date(iso).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function tabClassName(isActive: boolean) {
    return [
        "inline-flex min-h-[3.25rem] flex-col items-start justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        isActive
            ? "bg-[var(--accent-soft)]/90 text-[var(--accent-strong)] ring-1 ring-[var(--accent)]/25"
            : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
    ].join(" ");
}

function ProjectShellInner() {
    const navigate = useNavigate();
    const { user: me } = useContext(AuthContext);
    const { project, loading, error } = useProjectDetail();
    const teamTabVisible = showProjectTeamTab(me?.user_type);

    if (loading) {
        return (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-8 sm:py-4">
                <div className="space-y-3">
                    <div className="h-8 max-w-md animate-pulse rounded-lg bg-[var(--surface-soft)]" />
                    <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
                <p className="text-center text-[var(--danger)]">{error ?? "Unable to load project."}</p>
                <Link
                    to={UI_PATHS.PROJECTS()}
                    className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                    Back to projects
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-3 sm:px-8 sm:py-4">
                <button
                    type="button"
                    onClick={() => navigate(UI_PATHS.PROJECTS())}
                    className="group mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
                >
                    <span className="transition group-hover:-translate-x-0.5">←</span>
                    All projects
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                            Project
                        </p>
                        <h1 className="mt-0.5 text-lg font-semibold leading-snug tracking-tight text-[var(--text)] sm:text-xl">
                            {project.name}
                        </h1>
                        {project.description ? (
                            <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-snug text-[var(--muted)]">
                                {project.description}
                            </p>
                        ) : (
                            <p className="mt-1 text-xs italic text-[var(--muted)]/75">No description</p>
                        )}
                    </div>
                    <dl className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[10px] leading-tight text-[var(--muted)] sm:flex-col sm:items-end sm:gap-1 sm:text-right">
                        <div>
                            <dt className="text-[var(--muted)]/90">Created</dt>
                            <dd className="font-mono text-[var(--text)]">
                                {formatDateTime(project.created_at)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[var(--muted)]/90">Updated</dt>
                            <dd className="font-mono text-[var(--text)]">
                                {formatDateTime(project.updated_at)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <nav
                    className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-5"
                    aria-label="Project sections"
                >
                    {teamTabVisible ? (
                        <NavLink
                            to={UI_PATHS.PROJECT_USERS(project.id)}
                            className={({ isActive }) => tabClassName(isActive)}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="block leading-tight">Team</span>
                                    <span
                                        className={
                                            isActive
                                                ? "mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--accent-strong)]/80"
                                                : "mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--muted)]"
                                        }
                                    >
                                        Members & assignments
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ) : null}
                    <NavLink
                        to={UI_PATHS.PROJECT_PATIENTS(project.id)}
                        className={({ isActive }) => tabClassName(isActive)}
                        end
                    >
                        {({ isActive }) => (
                            <>
                                <span className="block leading-tight">Patients</span>
                                <span
                                    className={
                                        isActive
                                            ? "mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--accent-strong)]/80"
                                            : "mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[var(--muted)]"
                                    }
                                >
                                    Cases on this project
                                </span>
                            </>
                        )}
                    </NavLink>
                </nav>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}

function ProjectShell() {
    const { projectId } = useParams<{ projectId: string }>();
    if (!projectId) {
        return (
            <p className="p-6 text-sm text-[var(--danger)]">
                Missing project in route.
            </p>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
            <ProjectDetailProvider projectId={projectId}>
                <ProjectShellInner />
            </ProjectDetailProvider>
        </div>
    );
}

export default ProjectShell;
