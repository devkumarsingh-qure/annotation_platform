import axios from "axios";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { User } from "../../../types/User";
import { API_PATHS } from "../../../utils/urls";
import apiClient from "../../../utils/apiClient";
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

  const [isLoading, setIsLoading] = useState(!!userId);
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
            <header className="shrink-0 space-y-3">
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
