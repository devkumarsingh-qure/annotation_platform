import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Project as ProjectType } from "../../../../types/Project";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import apiClient from "../../../../utils/apiClient";
import { toastError, toastSuccess } from "../../../../utils/toast";
import { formatShortDate } from "../../../../utils/format";
import { statBlock } from "./StatBlock";
import ProjectError from "./ProjectError";
import { AuthContext } from "../../../../contexts/auth/authContext";
import UserGroupIcon from "../../../../icons/UserGroupIcon";
import FolderIcon from "../../../../icons/FolderIcon";
import DetailPageLoadingShell from "../../DetailPageLoadingShell";

function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const { user } = useContext(AuthContext);
  const canDelete = Boolean(user?.is_workspace_admin);

  const [isLoading, setIsLoading] = useState(!!projectId);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProject = useCallback(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    setLoadError(null);
    setIsLoading(true);
    apiClient
      .get<ProjectType>(API_PATHS.PROJECT(projectId))
      .then((response) => {
        setProject(response.data);
      })
      .catch((err) => {
        setProject(null);
        let msg = "Could not load this project.";
        if (axios.isAxiosError(err) && err.response?.data) {
          const d = err.response.data as { detail?: unknown };
          if (typeof d.detail === "string") msg = d.detail;
        }
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    setConfirmDelete(false);
    setDeleteError(null);
  }, [projectId]);

  const handleDelete = async () => {
    if (!projectId || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await apiClient.delete(API_PATHS.PROJECT(projectId));
      toastSuccess("Project deleted.");
      navigate(UI_PATHS.PROJECTS());
    } catch (err) {
      let msg = "Could not delete project. Try again or check permissions.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      setDeleteError(msg);
      toastError(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--muted)]">Missing project id.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col p-6">
        <nav
          className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]"
          aria-label="Breadcrumb"
        >
          <Link
            to={UI_PATHS.PROJECTS()}
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Projects
          </Link>
          <span className="px-1.5 opacity-70" aria-hidden>
            /
          </span>
          <span className="text-[var(--text)]">
            {project?.name ?? (isLoading ? "…" : "Project")}
          </span>
        </nav>

        {isLoading && <DetailPageLoadingShell />}

        {!isLoading && loadError && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ProjectError fetchProject={fetchProject} error={loadError} />
          </div>
        )}

        {!isLoading && project && !loadError && (
          <div className="flex w-full min-h-0 flex-1 flex-col gap-8 overflow-hidden">
            <header
              className={`shrink-0 space-y-3 border-b border-[var(--border)] pb-4${confirmDelete ? " relative z-40" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Project
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                    {project.name}
                  </h1>
                </div>
                {canDelete ? (
                  <div className="relative isolate flex min-h-[2.75rem] shrink-0 flex-col items-stretch sm:items-end">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(true);
                          setDeleteError(null);
                        }}
                        className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,var(--surface))] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] sm:self-end"
                      >
                        Delete project
                      </button>
                    ) : (
                      <div className="absolute right-0 top-0 z-30 flex w-[min(100vw-2rem,22rem)] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-4 shadow-lg">
                        <p className="text-sm text-[var(--text)]">
                          Delete{" "}
                          <span className="font-semibold">{project.name}</span>{" "}
                          from this workspace? Member and patient links for this
                          project will be removed. This cannot be undone.
                        </p>
                        {deleteError ? (
                          <p
                            className="text-xs text-[var(--danger)]"
                            role="alert"
                          >
                            {deleteError}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void handleDelete()}
                            className="rounded-lg grow bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {deleting ? "Deleting…" : "Delete permanently"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </header>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
              {statBlock("Members", project.member_count)}
              {statBlock("Patients", project.patient_count)}
              {statBlock("Created", formatShortDate(project.created_at))}
              {statBlock("Updated", formatShortDate(project.updated_at))}
            </div>

            <section className="h-0 grow flex min-h-0 shrink-0 flex-col space-y-2">
              <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Description
              </h2>
              <div
                className="h-0 grow shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)]"
                role="region"
                aria-label="Project description"
              >
                {project.description.trim() ? (
                  <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 text-sm leading-relaxed text-[var(--text)] break-words [scrollbar-gutter:stable]">
                    <p className="whitespace-pre-wrap">{project.description}</p>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-sm text-[var(--muted)]">
                    No description.
                  </div>
                )}
              </div>
            </section>

            <section className="shrink-0 space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {user?.is_workspace_admin && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(UI_PATHS.PROJECT_MEMBERS(project.id))
                    }
                    className="group flex w-full cursor-pointer gap-5 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-6 text-left transition hover:border-[color-mix(in_srgb,var(--accent)_38%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface-soft)_45%,var(--surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-soft))] text-[var(--accent)] transition group-hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface-soft))]">
                      <UserGroupIcon className="size-7" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
                        Members
                      </h3>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                        Manage members
                        <span
                          className="transition group-hover:translate-x-0.5"
                          aria-hidden
                        >
                          →
                        </span>
                      </span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(UI_PATHS.PROJECT_PATIENTS(project.id))
                  }
                  className="group flex w-full cursor-pointer gap-5 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-6 text-left transition hover:border-[color-mix(in_srgb,var(--accent)_38%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface-soft)_45%,var(--surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-soft))] text-[var(--accent)] transition group-hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface-soft))]">
                    <FolderIcon className="size-7" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
                      Patients
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                      Manage patients
                      <span
                        className="transition group-hover:translate-x-0.5"
                        aria-hidden
                      >
                        →
                      </span>
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Project;
