import axios from "axios";
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/authContext";
import type { User } from "../../../types/User";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess } from "../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { formatShortDate } from "../../../utils/format";
import Loading from "../../Loading";
import { statBlock } from "../Projects/Project/StatBlock";

function detailRow(label: string, value: ReactNode) {
  return (
    <div className="grid gap-1 border-b border-[var(--border)] py-3 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:gap-6">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-medium text-[var(--text)]">
        {value}
      </dd>
    </div>
  );
}

function UserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: me } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(!!userId);
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete =
    me?.is_workspace_admin === true &&
    userId !== undefined &&
    userId !== me.id;

  const fetchUser = useCallback(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setLoadError(null);
    setIsLoading(true);
    apiClient
      .get<User>(API_PATHS.USER(userId))
      .then((response) => {
        setUser(response.data);
      })
      .catch((err) => {
        setUser(null);
        let msg = "Could not load this user.";
        if (axios.isAxiosError(err) && err.response?.data) {
          const d = err.response.data as { detail?: unknown };
          if (typeof d.detail === "string") msg = d.detail;
        }
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    setConfirmDelete(false);
    setDeleteError(null);
  }, [userId]);

  const handleDelete = async () => {
    if (!userId || deleting || !canDelete) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await apiClient.delete(API_PATHS.USER(userId));
      toastSuccess("User deleted.");
      navigate(UI_PATHS.USERS());
    } catch (err) {
      let msg = "Could not delete user. Try again or check permissions.";
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

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--muted)]">Missing user id.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-6">
        <nav
          className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-0 bg-transparent p-0 font-inherit text-[var(--accent)] underline-offset-2 hover:underline"
          >
            ← Back
          </button>
        </nav>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-1 items-center justify-center">
            <Loading size="md" />
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className="rounded-xl border border-[var(--border)] bg-[color:var(--surface)] px-4 py-10 text-center">
            <p className="text-sm text-[var(--muted)]">{loadError}</p>
            <button
              type="button"
              onClick={() => fetchUser()}
              className="mt-4 min-h-9 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-xs font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_85%,var(--surface))]"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && user && !loadError && (
          <div className="flex w-full flex-col gap-8 pb-4">
            <header
              className={`shrink-0 space-y-3${confirmDelete ? " relative z-40" : ""}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Member
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                      {user.username}
                    </h1>
                    {user.is_workspace_admin ? (
                      <span className="rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-soft))] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                        Member
                      </span>
                    )}
                  </div>
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
                        Delete user
                      </button>
                    ) : (
                      <div className="absolute right-0 top-0 z-30 flex w-[min(100vw-2rem,20rem)] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-4 shadow-lg">
                        <p className="text-sm text-[var(--text)]">
                          Remove{" "}
                          <span className="font-semibold">{user.username}</span>{" "}
                          from this workspace? This cannot be undone.
                        </p>
                        {deleteError ? (
                          <p
                            className="text-xs text-[var(--danger)]"
                            role="alert"
                          >
                            {deleteError}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap space-x-2">
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
              {statBlock("Role", user.is_workspace_admin ? "Admin" : "Member")}
              {statBlock("Status", user.is_active ? "Active" : "Inactive")}
              {statBlock("Joined", formatShortDate(user.date_joined))}
              {statBlock(
                "Last login",
                user.last_login ? formatShortDate(user.last_login) : "Never",
              )}
            </div>

            <section className="shrink-0 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Account
              </h2>
              <div
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)] px-4 sm:px-5"
                role="region"
                aria-label="Account details"
              >
                <dl>
                  {detailRow(
                    "Email",
                    user.email?.trim() ? (
                      <span
                        className="block min-w-0 truncate"
                        title={user.email}
                      >
                        {user.email}
                      </span>
                    ) : (
                      "—"
                    ),
                  )}
                  {detailRow("Workspace", user.workspace.name)}
                </dl>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDetails;
