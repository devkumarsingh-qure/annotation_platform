import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { WorkspaceUser } from "../../../types/WorkspaceUser";
import apiClient from "../../../utils/apiClient";
import { toastError } from "../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { USER_TYPES } from "../../../utils/constants";

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

function formatDateTime(iso: string | null) {
    if (iso == null || iso === "") return null;
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

function userTypeLabel(value: string) {
    switch (value) {
        case USER_TYPES.WORKSPACE_ADMIN:
            return "Workspace admin";
        case USER_TYPES.ANNOTATOR:
            return "Annotator";
        default:
            return value;
    }
}

function User({ userId }: { userId: string }) {
    const navigate = useNavigate();
    const [user, setUser] = useState<WorkspaceUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            const msg = "Missing user.";
            setError(msg);
            toastError(msg);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        apiClient
            .get<WorkspaceUser>(API_PATHS.USER(userId))
            .then((res) => {
                if (!cancelled) setUser(res.data);
            })
            .catch(() => {
                if (!cancelled) {
                    const msg = "User not found or you do not have access.";
                    setError(msg);
                    toastError(msg);
                    setUser(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <div className="flex min-h-full flex-1 flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
            <div className="w-full min-w-0 flex-1 px-5 py-8 sm:px-8">
                <button
                    type="button"
                    onClick={() => navigate(UI_PATHS.USERS())}
                    className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
                >
                    <span className="transition group-hover:-translate-x-0.5">←</span>
                    All users
                </button>

                {loading ? (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
                            <div className="flex-1 space-y-3 pt-1">
                                <div className="h-8 max-w-sm animate-pulse rounded-lg bg-[var(--surface-soft)]" />
                                <div className="h-4 max-w-xs animate-pulse rounded bg-[var(--surface-soft)]" />
                            </div>
                        </div>
                        <div className="h-32 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]" />
                    </div>
                ) : error || !user ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] p-10 text-center backdrop-blur-[10px]">
                        <p className="text-[var(--danger)]">{error ?? "Unable to load user."}</p>
                        <Link
                            to={UI_PATHS.USERS()}
                            className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                        >
                            Back to users
                        </Link>
                    </div>
                ) : (
                    <>
                        <header className="border-b border-[var(--border)] pb-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                                Workspace member
                            </p>
                            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                                <div
                                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent-strong)]"
                                    aria-hidden
                                >
                                    {user.username.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                                        {user.username}
                                    </h1>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        {user.email ? (
                                            <a
                                                href={`mailto:${user.email}`}
                                                className="text-[var(--accent)] hover:underline"
                                            >
                                                {user.email}
                                            </a>
                                        ) : (
                                            <span className="italic">No email on file</span>
                                        )}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                                            {userTypeLabel(user.user_type)}
                                        </span>
                                        <span
                                            className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                user.is_active
                                                    ? "bg-[color-mix(in_srgb,var(--success)_14%,var(--surface-soft))] text-[var(--success)]"
                                                    : "bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface-soft))] text-[var(--danger)]"
                                            }`}
                                        >
                                            {user.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <section className="mt-10 grid gap-6 sm:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-6 backdrop-blur-[12px]">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                                    Account
                                </h2>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                    Identity and access in this workspace
                                </p>
                                <dl className="mt-5 space-y-4 text-sm">
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--muted)]">User ID</dt>
                                        <dd className="mt-1 font-mono text-[var(--text)]">{user.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--muted)]">Username</dt>
                                        <dd className="mt-1 font-medium text-[var(--text)]">{user.username}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-6 backdrop-blur-[12px]">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                                    Activity
                                </h2>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                    When they joined and last signed in
                                </p>
                                <dl className="mt-5 space-y-4 text-sm">
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--muted)]">Date joined</dt>
                                        <dd className="mt-1 text-[var(--text)]">{formatDate(user.date_joined)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--muted)]">Last login</dt>
                                        <dd className="mt-1 text-[var(--text)]">
                                            {formatDateTime(user.last_login) ?? "Never"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default User;
