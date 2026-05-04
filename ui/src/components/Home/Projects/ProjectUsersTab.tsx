import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectMemberRow } from "../../../types/Workspace";
import type { WorkspaceUser } from "../../../types/WorkspaceUser";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import { USER_TYPES } from "../../../utils/constants";
import { useProjectDetail } from "./ProjectDetailContext";
import { patchMemberCount } from "./projectMutations";
import { isAnnotator } from "../../../utils/roleUi";

const btnSecondary =
    "inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--text)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--accent)]/40 enabled:hover:bg-[var(--accent-soft)]/30 enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/35";
const btnPrimary =
    "inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:bg-[var(--accent-strong)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/40";
const btnDanger =
    "inline-flex min-h-8 items-center justify-center rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--danger)]/30 enabled:hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] enabled:hover:text-[var(--danger)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--danger)]/30";
const linkBack =
    "self-start text-xs font-medium text-[var(--muted)] transition enabled:hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 rounded-sm";
const checkboxClass =
    "h-5 w-5 shrink-0 cursor-pointer rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/35";

type TeamScreen = "team" | "addUsers";

function emptySet(): Set<string> {
    return new Set();
}

function ProjectUsersTab() {
    const { user: me } = useContext(AuthContext);
    const isWorkspaceAdmin = me?.user_type === USER_TYPES.WORKSPACE_ADMIN;
    const { project, setProject, projectId, refetch } = useProjectDetail();

    const [members, setMembers] = useState<ProjectMemberRow[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);

    const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
    const [usersLoadError, setUsersLoadError] = useState<string | null>(null);
    const [usersLoading, setUsersLoading] = useState(false);

    const [teamScreen, setTeamScreen] = useState<TeamScreen>("team");
    const [selectedAddUserIds, setSelectedAddUserIds] = useState<Set<string>>(() => emptySet());
    const [addingBulk, setAddingBulk] = useState(false);
    const [teamRemoveSelected, setTeamRemoveSelected] = useState<Set<string>>(() => emptySet());
    const [removingMembers, setRemovingMembers] = useState(false);

    const canManageMembers = isWorkspaceAdmin;
    const canManageAssignments = isWorkspaceAdmin;
    const canViewMemberList = !isAnnotator(me?.user_type);

    const fetchMembers = useCallback(() => {
        if (!projectId || !canViewMemberList) {
            setMembers([]);
            setMembersLoading(false);
            setMembersError(null);
            return;
        }
        setMembersLoading(true);
        setMembersError(null);
        apiClient
            .get<{ results: ProjectMemberRow[] }>(API_PATHS.PROJECT_USERS(projectId))
            .then((res) => setMembers(res.data.results))
            .catch(() => {
                setMembersError("Could not load project members.");
                setMembers([]);
            })
            .finally(() => setMembersLoading(false));
    }, [projectId, canViewMemberList]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const memberIds = useMemo(() => new Set(members.map((u) => String(u.id))), [members]);

    const shouldLoadWorkspaceUsers =
        teamScreen === "addUsers" && canManageMembers && project != null;

    useEffect(() => {
        if (!shouldLoadWorkspaceUsers) {
            return;
        }
        let cancelled = false;
        setUsersLoadError(null);
        setWorkspaceUsers([]);
        setUsersLoading(true);
        apiClient
            .get<WorkspaceUser[]>(API_PATHS.USERS())
            .then((res) => {
                if (!cancelled) setWorkspaceUsers(res.data);
            })
            .catch(() => {
                if (!cancelled) {
                    setUsersLoadError("Could not load workspace users.");
                }
            })
            .finally(() => {
                if (!cancelled) setUsersLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [shouldLoadWorkspaceUsers, projectId]);

    const usersListLoading = shouldLoadWorkspaceUsers && usersLoading;

    const sortedWorkspaceUsers = useMemo(
        () => [...workspaceUsers].sort((a, b) => a.username.localeCompare(b.username)),
        [workspaceUsers],
    );

    const availableToAdd = useMemo(
        () =>
            sortedWorkspaceUsers.filter(
                (u) => u.is_active && !memberIds.has(String(u.id)),
            ),
        [sortedWorkspaceUsers, memberIds],
    );

    const toggleAddUser = (uid: string) => {
        setSelectedAddUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    const addMembersBulk = async () => {
        if (!project || !canManageMembers) return;
        const ids = Array.from(selectedAddUserIds);
        if (ids.length === 0) return;
        setAddingBulk(true);
        try {
            const { data } = await apiClient.post<{
                added: { id: string; username: string }[];
                skipped: { id?: string; reason?: string }[];
            }>(API_PATHS.PROJECT_USERS(projectId), { user_ids: ids });
            if (data.added.length) {
                setProject((prev) =>
                    prev ? patchMemberCount(prev, data.added.length) : prev,
                );
                setSelectedAddUserIds(emptySet());
                setTeamScreen("team");
                void refetch();
                fetchMembers();
                toastSuccess(
                    `Added ${data.added.length} user${data.added.length === 1 ? "" : "s"} to the project.`,
                );
            }
            if (data.skipped.length) {
                const ws = data.skipped.filter((s) => s.reason === "wrong_workspace").length;
                const msg =
                    ws > 0
                        ? "Some users could not be added (not in this workspace)."
                        : "Some users could not be added.";
                toastWarning(data.added.length ? `${msg} Others were added.` : msg);
            } else if (!data.added.length) {
                toastError("Could not add users to the project.");
            }
        } catch {
            toastError("Could not add users to the project.");
        } finally {
            setAddingBulk(false);
        }
    };

    const toggleTeamRemove = (uid: string) => {
        setTeamRemoveSelected((prev) => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    const removeSelectedMembers = async () => {
        if (!project || !canManageMembers || removingMembers) return;
        const ids = Array.from(teamRemoveSelected);
        if (ids.length === 0) return;
        setRemovingMembers(true);
        try {
            const { data } = await apiClient.delete<{
                removed: { id: string; username: string }[];
                skipped: { id?: string; reason?: string }[];
            }>(API_PATHS.PROJECT_USERS(projectId), { data: { user_ids: ids } });
            const removedIds = data.removed.map((r) => String(r.id));
            if (removedIds.length) {
                setProject((prev) =>
                    prev ? patchMemberCount(prev, -removedIds.length) : prev,
                );
                setTeamRemoveSelected(emptySet());
                void refetch();
                fetchMembers();
                toastSuccess(
                    `Removed ${removedIds.length} user${removedIds.length === 1 ? "" : "s"} from the project.`,
                );
            }
            if (data.skipped.length) {
                if (data.removed.length) {
                    toastWarning(
                        "Some users could not be removed; others were removed.",
                    );
                } else {
                    toastError("Could not remove selected users from the project.");
                }
            }
        } catch {
            toastError("Could not remove one or more users from the project.");
        } finally {
            setRemovingMembers(false);
        }
    };

    if (!project) return null;

    if (teamScreen === "addUsers") {
        const n = selectedAddUserIds.size;
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
                <div className="flex w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedAddUserIds(emptySet());
                            setTeamScreen("team");
                        }}
                        className={`mb-4 shrink-0 ${linkBack}`}
                    >
                        ← Back to team
                    </button>
                    <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,var(--accent-soft))] px-4 py-4 sm:px-5">
                        <h2 className="text-sm font-semibold text-[var(--text)]">Add workspace members</h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                            Only users already in this workspace can be added. Open a member from the team list to
                            assign patients.
                        </p>
                    </div>
                    {usersListLoading ? (
                        <p className="mt-6 text-xs text-[var(--muted)]">Loading workspace users…</p>
                    ) : usersLoadError ? (
                        <p className="mt-6 text-sm text-[var(--danger)]">{usersLoadError}</p>
                    ) : availableToAdd.length === 0 ? (
                        <p className="mt-6 text-sm text-[var(--muted)]">
                            Everyone who can be added is already on this project.
                        </p>
                    ) : (
                        <>
                            <ul className="mt-5 min-h-0 flex-1 divide-y divide-[var(--border)]/60 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] shadow-sm">
                                {availableToAdd.map((u) => {
                                    const uid = String(u.id);
                                    const checked = selectedAddUserIds.has(uid);
                                    return (
                                        <li key={uid} className="px-3 py-2 sm:px-4">
                                            {canManageMembers ? (
                                                <label
                                                    className="flex min-h-11 cursor-pointer items-center gap-3 py-1 has-[:disabled]:cursor-not-allowed"
                                                    htmlFor={`add-user-${uid}`}
                                                >
                                                    <input
                                                        id={`add-user-${uid}`}
                                                        type="checkbox"
                                                        className={checkboxClass}
                                                        checked={checked}
                                                        onChange={() => toggleAddUser(uid)}
                                                        disabled={addingBulk}
                                                        aria-label={`Select ${u.username}`}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--text)]">
                                                        {u.username}
                                                    </span>
                                                </label>
                                            ) : (
                                                <span className="font-medium text-[var(--text)]">
                                                    {u.username}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            {canManageMembers ? (
                                <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--border)]/60 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAddUserIds(emptySet())}
                                        disabled={n === 0 || addingBulk}
                                        className={btnSecondary}
                                    >
                                        Clear selection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void addMembersBulk()}
                                        disabled={n === 0 || addingBulk}
                                        className={btnPrimary}
                                    >
                                        {addingBulk ? "Adding…" : `Confirm add (${n})`}
                                    </button>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
            <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
                <section>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-lg">
                            <h2 className="text-base font-semibold tracking-tight text-[var(--text)]">
                                Team
                            </h2>
                            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                                {canManageAssignments
                                    ? "Open a member to assign patients. Workspace admins add or remove people here."
                                    : "Project members are listed below."}
                            </p>
                        </div>
                        {canManageMembers ? (
                            <button type="button" onClick={() => setTeamScreen("addUsers")} className={btnPrimary}>
                                + Add users
                            </button>
                        ) : null}
                    </div>

                    {membersLoading ? (
                        <p className="mt-6 text-xs text-[var(--muted)]">Loading team…</p>
                    ) : membersError ? (
                        <p className="mt-6 text-sm text-[var(--danger)]">{membersError}</p>
                    ) : members.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/40 px-5 py-10 text-center">
                            <p className="text-sm text-[var(--muted)]">
                                No members yet.
                                {canManageMembers ? " Add users from your workspace to get started." : ""}
                            </p>
                        </div>
                    ) : (
                        <>
                            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                {[...members]
                                    .sort((a, b) => a.username.localeCompare(b.username))
                                    .map((u) => {
                                        const uid = String(u.id);
                                        const checked = teamRemoveSelected.has(uid);
                                        const initial = (u.username?.[0] ?? "?").toUpperCase();
                                        return (
                                            <li
                                                key={uid}
                                                className="flex min-h-[4.25rem] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] px-4 py-3 shadow-sm"
                                            >
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_65%,var(--surface))] text-sm font-bold text-[var(--accent-strong)] ring-2 ring-[var(--accent)]/20"
                                                    aria-hidden
                                                >
                                                    {initial}
                                                </div>
                                                {canManageMembers ? (
                                                    <label
                                                        className="flex min-h-11 min-w-0 shrink-0 cursor-pointer items-center gap-3 py-0.5 has-[:disabled]:cursor-not-allowed"
                                                        htmlFor={`remove-member-${uid}`}
                                                    >
                                                        <input
                                                            id={`remove-member-${uid}`}
                                                            type="checkbox"
                                                            className={checkboxClass}
                                                            checked={checked}
                                                            onChange={() => toggleTeamRemove(uid)}
                                                            disabled={removingMembers}
                                                            aria-label={`Select ${u.username} for removal`}
                                                        />
                                                    </label>
                                                ) : null}
                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <span className="truncate font-medium text-[var(--text)]">
                                                        {u.username}
                                                    </span>
                                                    <span className="text-[10px] uppercase text-[var(--muted)]">
                                                        {u.role}
                                                    </span>
                                                </div>
                                                {canManageAssignments ? (
                                                    <Link
                                                        to={UI_PATHS.PROJECT_USER(projectId, uid)}
                                                        className="shrink-0 text-[10px] font-medium text-[var(--accent)] transition hover:underline"
                                                    >
                                                        Assignments →
                                                    </Link>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                            </ul>
                            {canManageMembers && teamRemoveSelected.size > 0 ? (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTeamRemoveSelected(emptySet())}
                                        disabled={removingMembers}
                                        className={btnSecondary}
                                    >
                                        Clear selection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void removeSelectedMembers()}
                                        disabled={removingMembers}
                                        className={btnDanger}
                                    >
                                        {removingMembers
                                            ? "Removing…"
                                            : `Remove from project (${teamRemoveSelected.size})`}
                                    </button>
                                </div>
                            ) : null}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

export default ProjectUsersTab;
