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
import DetailPageLoadingShell from "../DetailPageLoadingShell";
import { statBlock } from "../Projects/Project/StatBlock";

const fieldClass =
  "w-full min-h-10 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--accent)]/45 focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60";

function profileRow(label: string, control: ReactNode) {
  return (
    <div className="grid gap-2 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,8.5rem)_1fr] sm:items-center sm:gap-8 sm:px-5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <div className="min-w-0">{control}</div>
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

  const [draftUsername, setDraftUsername] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftIsActive, setDraftIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canEdit = me?.is_workspace_admin === true;
  const isSelf = me != null && userId === String(me.id);

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

  useEffect(() => {
    if (!user) return;
    setDraftUsername(user.username);
    setDraftEmail(user.email?.trim() ?? "");
    setDraftIsActive(user.is_active);
    setSaveError(null);
  }, [user]);

  const isDirty =
    user != null &&
    (draftUsername.trim() !== user.username ||
      draftEmail.trim() !== (user.email?.trim() ?? "") ||
      (!isSelf && draftIsActive !== user.is_active));

  const discardEdits = () => {
    if (!user) return;
    setDraftUsername(user.username);
    setDraftEmail(user.email?.trim() ?? "");
    setDraftIsActive(user.is_active);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!userId || !user || saving || !canEdit) return;
    const trimmedUser = draftUsername.trim();
    if (!trimmedUser) {
      setSaveError("Username is required.");
      return;
    }
    const payload: { username?: string; email?: string; is_active?: boolean } =
      {};
    if (trimmedUser !== user.username) payload.username = trimmedUser;
    if (draftEmail.trim() !== (user.email?.trim() ?? "")) {
      payload.email = draftEmail.trim();
    }
    if (!isSelf && draftIsActive !== user.is_active) {
      payload.is_active = draftIsActive;
    }
    if (Object.keys(payload).length === 0) return;

    setSaveError(null);
    setSaving(true);
    try {
      const { data } = await apiClient.patch<User>(
        API_PATHS.USER(userId),
        payload,
      );
      setUser(data);
      toastSuccess("Member updated.");
    } catch (err) {
      let msg = "Could not save changes.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      setSaveError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

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

  const titleDisplay =
    canEdit && user
      ? draftUsername.trim() || user.username
      : (user?.username ?? "");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
      <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col px-6 pt-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pb-6">
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

            {isLoading ? <DetailPageLoadingShell /> : null}

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
              <div className="flex w-full flex-col gap-8">
                <header
                  className={`shrink-0 space-y-3${confirmDelete ? " relative z-40" : ""}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        Member
                      </p>
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <h1 className="min-w-0 max-w-xl truncate text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                          {titleDisplay}
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
                              <span className="font-semibold">
                                {user.username}
                              </span>{" "}
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

                <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3">
                  {statBlock("Role", user.is_workspace_admin ? "Admin" : "Member")}
                  {statBlock("Joined", formatShortDate(user.date_joined))}
                  {statBlock(
                    "Last login",
                    user.last_login ? formatShortDate(user.last_login) : "Never",
                  )}
                </div>

                <section
                  className="shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[color:var(--surface)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_40%,transparent)]"
                  aria-label="Profile"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-5 py-4">
                    <div className="my-auto min-w-0 flex-1">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Profile
                      </h2>
                      {isSelf && canEdit ? (
                        <p className="mt-2 max-w-md text-xs leading-snug text-[var(--muted)]">
                          Signing in for your own account can&apos;t be turned
                          off here.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
                      <span className="hidden text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--muted)] sm:inline">
                        Sign-in
                      </span>
                      {!isSelf && canEdit ? (
                        <label
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_50%,transparent)] px-3.5 py-2 transition hover:border-[color-mix(in_srgb,var(--accent)_22%,var(--border))] ${
                            saving
                              ? "pointer-events-none opacity-55"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={draftIsActive}
                            disabled={saving}
                            onChange={(e) =>
                              setDraftIsActive(e.target.checked)
                            }
                            className="size-[1.125rem] rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                          />
                          <span className="text-xs font-semibold tabular-nums text-[var(--text)]">
                            {draftIsActive ? "Allowed" : "Blocked"}
                          </span>
                        </label>
                      ) : (
                        <span
                          className={`inline-flex rounded-lg border px-3.5 py-2 text-xs font-semibold tabular-nums ${
                            user.is_active
                              ? "border-[color-mix(in_srgb,var(--success)_38%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[color-mix(in_srgb,var(--success)_92%,var(--text))]"
                              : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {profileRow(
                      "Username",
                      canEdit ? (
                        <input
                          id="member-username"
                          type="text"
                          value={draftUsername}
                          onChange={(e) => setDraftUsername(e.target.value)}
                          disabled={saving}
                          autoComplete="off"
                          maxLength={150}
                          className={fieldClass}
                        />
                      ) : (
                        <p className="text-sm font-medium text-[var(--text)]">
                          {user.username}
                        </p>
                      ),
                    )}
                    {profileRow(
                      "Email",
                      canEdit ? (
                        <input
                          id="member-email"
                          type="email"
                          value={draftEmail}
                          onChange={(e) => setDraftEmail(e.target.value)}
                          disabled={saving}
                          autoComplete="off"
                          className={fieldClass}
                          placeholder="Optional"
                        />
                      ) : user.email?.trim() ? (
                        <p
                          className="truncate text-sm font-medium text-[var(--text)]"
                          title={user.email}
                        >
                          {user.email}
                        </p>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">—</span>
                      ),
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          {!isLoading && user && !loadError && canEdit && isDirty ? (
            <div
              className="shrink-0 border-t border-[color-mix(in_srgb,var(--border)_80%,transparent)] px-0 py-4"
              role="region"
              aria-label="Save profile changes"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {saveError ? (
                  <p className="text-sm text-[var(--danger)]" role="alert">
                    {saveError}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--muted)]">Unsaved changes</p>
                )}
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => discardEdits()}
                    className="min-h-9 cursor-pointer rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-4 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    disabled={saving || !draftUsername.trim()}
                    onClick={() => void handleSave()}
                    className="min-h-9 cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_38%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 text-xs font-semibold text-white shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--accent-strong)_50%,transparent)] transition hover:brightness-[1.05] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default UserDetails;
