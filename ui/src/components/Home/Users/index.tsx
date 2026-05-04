import { useContext, useEffect, useState } from "react";
import type { WorkspaceUser } from "../../../types/WorkspaceUser";
import { AuthContext } from "../../../contexts/auth/authContext";
import AddUser from "./AddUser";
import apiClient from "../../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { USER_TYPES } from "../../../utils/constants";
import { isAnnotator } from "../../../utils/roleUi";
import { Link, Navigate, useParams } from "react-router-dom";
import User from "./User";

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

function userTypeLabel(value: typeof USER_TYPES[keyof typeof USER_TYPES]) {
    switch (value) {
        case USER_TYPES.WORKSPACE_ADMIN:
            return "Workspace admin";
        case USER_TYPES.ANNOTATOR:
            return "Annotator";
        default:
            return value;
    }
}

function Users() {
    const { userId } = useParams<{ userId: string }>();

    const { user: me } = useContext(AuthContext);
    const canInvite = me?.user_type === USER_TYPES.WORKSPACE_ADMIN;
    const canViewWorkspaceDirectory = canInvite;

    const [users, setUsers] = useState<WorkspaceUser[]>([]);
    const [loading, setLoading] = useState(() => canViewWorkspaceDirectory);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        if (!canViewWorkspaceDirectory) {
            return;
        }
        let cancelled = false;
        apiClient
            .get<WorkspaceUser[]>(API_PATHS.USERS())
            .then((response) => {
                if (!cancelled) setUsers(response.data);
            })
            .catch(() => {
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [canViewWorkspaceDirectory]);

    const handleCreated = (created: WorkspaceUser) => {
        setUsers((prev) => {
            const next = [...prev, created];
            next.sort((a, b) => a.username.localeCompare(b.username));
            return next;
        });
    };

    if (userId && isAnnotator(me?.user_type)) {
        return <Navigate to={UI_PATHS.PROJECTS()} replace />;
    }

    return (
        <div className="flex min-h-full flex-1 flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
            {
                userId ? (
                    <User userId={userId} />
                ) : (
                    <div className="flex w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8">
                        {!canViewWorkspaceDirectory ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] px-8 py-14 text-center backdrop-blur-[10px]">
                                <h2 className="text-lg font-semibold text-[var(--text)]">
                                    Workspace directory
                                </h2>
                                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                                    Only workspace admins can browse all accounts. Other roles manage members,
                                    patients, and assignments from each project.
                                </p>
                            </div>
                        ) : createOpen && canInvite ? (
                            <AddUser
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
                                            Users
                                        </h1>
                                        <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                                            People in your workspace. Workspace admins can invite new accounts and
                                            assign roles.
                                        </p>
                                    </div>
                                    {canInvite ? (
                                        <AddUser
                                            open={createOpen}
                                            onOpenChange={setCreateOpen}
                                            onCreated={handleCreated}
                                        />
                                    ) : null}
                                </header>

                                {loading ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"
                                            />
                                        ))}
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--surface)] px-8 py-16 text-center backdrop-blur-[10px]">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]/80 text-2xl text-[var(--accent)]">
                                            ◆
                                        </div>
                                        <h2 className="text-lg font-semibold text-[var(--text)]">No users yet</h2>
                                        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                                            {canInvite
                                                ? "Invite teammates to start collaborating on projects."
                                                : "Your workspace has no other members listed."}
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {users.map((u) => (
                                            <li key={u.id}>
                                                <Link
                                                    to={UI_PATHS.USER(u.id)}
                                                    className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_12px_32px_-18px_color-mix(in_srgb,var(--text)_18%,transparent)] backdrop-blur-[12px] transition hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] hover:shadow-[0_20px_40px_-20px_color-mix(in_srgb,var(--accent)_22%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
                                                >
                                                    <div className="mb-4 flex items-start gap-3">
                                                        <div
                                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-strong)]"
                                                            aria-hidden
                                                        >
                                                            {u.username.slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h2 className="truncate text-base font-semibold leading-snug text-[var(--text)]">
                                                                {u.username}
                                                            </h2>
                                                            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                                                {u.email || "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border)]/80 pt-4">
                                                        <span className="inline-flex rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-medium text-[var(--text)]">
                                                            {userTypeLabel(u.user_type as typeof USER_TYPES[keyof typeof USER_TYPES])}
                                                        </span>
                                                        <span
                                                            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${u.is_active
                                                                ? "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-soft))] text-[var(--success)]"
                                                                : "bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-soft))] text-[var(--danger)]"
                                                                }`}
                                                        >
                                                            {u.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">
                                                        <p>
                                                            <span className="font-medium">Joined</span>{" "}
                                                            <span className="text-[var(--text)]">
                                                                {formatDate(u.date_joined)}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Last login</span>{" "}
                                                            <span className="text-[var(--text)]">
                                                                {formatDateTime(u.last_login) ?? "Never"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                )
            }
        </div>
    );
}

export default Users;
