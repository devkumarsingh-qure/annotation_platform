import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "../../../../types/User";
import type { PaginatedResponse } from "../../../../types/PaginatedResponse";
import apiClient from "../../../../utils/apiClient";
import Loading from "../../../Loading";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../PaginatedTable";
import { formatShortDate } from "../../../../utils/format";
import { toastError, toastSuccess } from "../../../../utils/toast";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

function ProjectMembers() {
  const { projectId } = useParams();

  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<string[]>([]);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [workspaceAddPage, setWorkspaceAddPage] = useState(1);
  const [workspaceAddPageSize, setWorkspaceAddPageSize] =
    useState(DEFAULT_PAGE_SIZE);
  const [workspaceAddRows, setWorkspaceAddRows] = useState<User[]>([]);
  const [workspaceAddTotal, setWorkspaceAddTotal] = useState(0);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [selectedAddIds, setSelectedAddIds] = useState<string[]>([]);
  const [addBusy, setAddBusy] = useState(false);

  const removeHeaderRef = useRef<HTMLInputElement>(null);

  const selectedRemoveSet = useMemo(
    () => new Set(membersToRemove),
    [membersToRemove],
  );

  const selectedAddSet = useMemo(
    () => new Set(selectedAddIds),
    [selectedAddIds],
  );

  const memberIdSet = useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const displayAddRows = useMemo(
    () => workspaceAddRows.filter((u) => !memberIdSet.has(u.id)),
    [workspaceAddRows, memberIdSet],
  );

  const exitAddMode = useCallback(() => {
    setAddMode(false);
    setSelectedAddIds([]);
    setWorkspaceAddPage(1);
    setWorkspaceAddRows([]);
    setWorkspaceAddTotal(0);
  }, []);

  const fetchMembers = useCallback(() => {
    if (!projectId) return Promise.resolve();
    setIsMembersLoading(true);
    return apiClient
      .get<User[]>(API_PATHS.PROJECT_USERS(projectId))
      .then((response) => {
        setMembers(response.data);
      })
      .catch(() => {
        setMembers([]);
        toastError("Could not load project members.");
      })
      .finally(() => {
        setIsMembersLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!addMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitAddMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addMode, exitAddMode]);

  useEffect(() => {
    const el = removeHeaderRef.current;
    if (!el || addMode) return;
    const n = members.length;
    const sel = selectedRemoveSet.size;
    el.indeterminate = n > 0 && sel > 0 && sel < n;
    el.checked = n > 0 && sel === n;
  }, [addMode, members, selectedRemoveSet]);

  useEffect(() => {
    if (!addMode) return;
    let cancelled = false;
    setWorkspaceLoading(true);
    apiClient
      .get<PaginatedResponse<User>>(
        API_PATHS.USERS({
          page: workspaceAddPage,
          page_size: workspaceAddPageSize,
        }),
      )
      .then(({ data }) => {
        if (cancelled) return;
        setWorkspaceAddRows(data.results);
        setWorkspaceAddTotal(data.total);
      })
      .catch(() => {
        if (cancelled) return;
        setWorkspaceAddRows([]);
        setWorkspaceAddTotal(0);
        toastError("Could not load workspace users.");
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addMode, workspaceAddPage, workspaceAddPageSize]);

  const addTotalPages = Math.max(
    1,
    Math.ceil(workspaceAddTotal / workspaceAddPageSize),
  );
  useEffect(() => {
    if (!addMode) return;
    if (workspaceAddPage > addTotalPages) {
      setWorkspaceAddPage(addTotalPages);
    }
  }, [addMode, workspaceAddPage, addTotalPages]);

  const enterAddMode = () => {
    setMembersToRemove([]);
    setAddMode(true);
    setSelectedAddIds([]);
    setWorkspaceAddPage(1);
    setWorkspaceAddRows([]);
    setWorkspaceAddTotal(0);
  };

  const handleWorkspaceAddPageSizeChange = useCallback((n: number) => {
    setWorkspaceAddPageSize(n);
    setWorkspaceAddPage(1);
  }, []);

  const toggleRemoveRow = (id: string) => {
    setMembersToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllRemove = () => {
    if (selectedRemoveSet.size === members.length) {
      setMembersToRemove([]);
    } else {
      setMembersToRemove(members.map((m) => m.id));
    }
  };

  const cancelRemoval = () => setMembersToRemove([]);

  const toggleAddRow = (id: string) => {
    setSelectedAddIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAddPageSelection = useCallback(
    (rowIds: string[], select: boolean) => {
      setSelectedAddIds((prev) => {
        const next = new Set(prev);
        for (const id of rowIds) {
          if (select) next.add(id);
          else next.delete(id);
        }
        return Array.from(next);
      });
    },
    [],
  );

  const addModeColumns: PaginatedTableColumn<User>[] = useMemo(
    () => [
      {
        id: "username",
        header: "Username",
        cell: (m: User) => (
          <Link
            to={UI_PATHS.USER(m.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={m.username}
          >
            {m.username}
          </Link>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (m: User) => {
          const raw = m.email?.trim();
          if (!raw) {
            return <span className="text-[var(--muted)]">—</span>;
          }
          return (
            <span
              className="block min-w-0 w-full truncate text-[var(--muted)]"
              title={raw}
            >
              {raw}
            </span>
          );
        },
      },
      {
        id: "role",
        header: "Role",
        cell: (m: User) =>
          m.is_workspace_admin ? (
            <span className="rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-soft))] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              Admin
            </span>
          ) : (
            <span className="text-[var(--muted)]">Member</span>
          ),
      },
      {
        id: "joined",
        header: "—",
        cell: (m: User) => (
          <span className="text-[var(--muted)]">
            {formatShortDate(m.date_joined)}
          </span>
        ),
      },
    ],
    [],
  );

  const addSelected = async () => {
    if (!projectId || selectedAddIds.length === 0 || addBusy) return;
    setAddBusy(true);
    try {
      await apiClient.post(API_PATHS.PROJECT_USERS(projectId), {
        user_ids: selectedAddIds,
      });
      toastSuccess(
        selectedAddIds.length === 1
          ? "Added 1 member."
          : `Added ${selectedAddIds.length} members.`,
      );
      exitAddMode();
      await fetchMembers();
    } catch (err) {
      let msg = "Could not add members.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      toastError(msg);
    } finally {
      setAddBusy(false);
    }
  };

  const removeSelected = async () => {
    if (!projectId || membersToRemove.length === 0 || removeBusy) return;
    setRemoveBusy(true);
    try {
      await apiClient.delete(API_PATHS.PROJECT_USERS(projectId), {
        data: { user_ids: membersToRemove },
      });
      toastSuccess(
        membersToRemove.length === 1
          ? "Removed 1 member from the project."
          : `Removed ${membersToRemove.length} members from the project.`,
      );
      setMembersToRemove([]);
      await fetchMembers();
    } catch (err) {
      let msg = "Could not remove members.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      toastError(msg);
    } finally {
      setRemoveBusy(false);
    }
  };

  if (!projectId) return null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
      <nav className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]">
        {projectId ? (
          <Link
            to={UI_PATHS.PROJECT(projectId)}
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            ← Back to project
          </Link>
        ) : null}
      </nav>
      <h2 className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
        Members
      </h2>
      <div className="mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
            Manage the team that works on this project.
          </h3>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            {addMode
              ? "Select workspace users below, then add them to this project."
              : "Select members below, then remove them from the project in one step."}
          </p>
        </div>
        {membersToRemove.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelRemoval}
              disabled={removeBusy}
              className="min-h-9 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={removeBusy || isMembersLoading}
              className="min-h-9 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-3 text-xs font-semibold text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-soft))] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {removeBusy ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : addMode && selectedAddIds.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={exitAddMode}
              disabled={addBusy}
              className="min-h-9 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addSelected}
              disabled={addBusy || workspaceLoading}
              className="min-h-9 w-20 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {addBusy ? "Adding…" : "Add"}
            </button>
          </div>
        ) : addMode ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={exitAddMode}
              disabled={addBusy || workspaceLoading}
              className="min-h-9 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={enterAddMode}
              disabled={isMembersLoading || removeBusy}
              className="min-h-9 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add members
            </button>
          </div>
        )}
      </div>
      <div className="mt-6 flex min-h-0 grow flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[color:var(--surface)]">
        {!addMode && isMembersLoading ? (
          <div className="flex h-full items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : addMode ? (
          <PaginatedTable
            isLoading={workspaceLoading}
            columns={addModeColumns}
            rows={displayAddRows}
            getRowId={(row) => row.id}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pagination={{
              page: workspaceAddPage,
              pageSize: workspaceAddPageSize,
              total: workspaceAddTotal,
              onPageChange: setWorkspaceAddPage,
              onPageSizeChange: handleWorkspaceAddPageSizeChange,
            }}
            selection={{
              selectedIds: selectedAddSet,
              onToggleRow: toggleAddRow,
              onTogglePageRows: toggleAddPageSelection,
              disabled: addBusy,
            }}
          />
        ) : (
          <div className="max-h-full overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="sticky top-0 z-[1] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_92%,transparent)] backdrop-blur-sm">
                  <th className="w-12 px-3 py-2.5 text-center first:pl-4">
                    <input
                      ref={removeHeaderRef}
                      type="checkbox"
                      disabled={members.length === 0 || removeBusy}
                      onChange={toggleSelectAllRemove}
                      className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                      aria-label="Select all members"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Username
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Email
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Role
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] last:pr-4">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-14 text-center text-sm text-[var(--muted)]"
                    >
                      No members on this project yet.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--border)] transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)]"
                    >
                      <td className="px-3 py-2.5 text-center align-middle first:pl-4">
                        <input
                          type="checkbox"
                          checked={selectedRemoveSet.has(m.id)}
                          onChange={() => toggleRemoveRow(m.id)}
                          disabled={removeBusy}
                          className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                          aria-label={`Select ${m.username}`}
                        />
                      </td>
                      <td className="max-w-0 min-w-0 overflow-hidden px-3 py-2.5 font-medium">
                        <Link
                          to={UI_PATHS.PROJECT_USER_PATIENTS(projectId, m.id)}
                          className="block min-w-0 truncate text-[var(--accent)] underline-offset-2 hover:underline"
                          title={m.username}
                        >
                          {m.username}
                        </Link>
                      </td>
                      <td className="max-w-0 min-w-0 overflow-hidden px-3 py-2.5 text-[var(--muted)]">
                        <span
                          className="block min-w-0 truncate"
                          title={m.email || undefined}
                        >
                          {m.email?.trim() ? m.email : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm">
                        {m.is_workspace_admin ? (
                          <span className="rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-soft))] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">Member</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm text-[var(--text)] last:pr-4">
                        {formatShortDate(m.date_joined)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectMembers;
