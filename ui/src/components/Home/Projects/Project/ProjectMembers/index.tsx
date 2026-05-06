import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { API_PATHS, UI_PATHS } from "../../../../../utils/urls";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../../../../../types/User";
import apiClient from "../../../../../utils/apiClient";
import Loading from "../../../../Loading";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../../PaginatedTable";
import { formatShortDate } from "../../../../../utils/format";
import { toastError, toastSuccess } from "../../../../../utils/toast";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../../../../utils/constants";
import AddMembers from "./AddMembers";

function ProjectMembers() {
  const { projectId } = useParams();

  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [membersToRemove, setMembersToRemove] = useState<string[]>([]);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(DEFAULT_PAGE_SIZE);

  const selectedRemoveSet = useMemo(
    () => new Set(membersToRemove),
    [membersToRemove],
  );

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

  const enterAddMode = () => {
    setMembersToRemove([]);
    setAddMode(true);
  };

  const toggleRemoveRow = (id: string) => {
    setMembersToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const cancelRemoval = () => setMembersToRemove([]);

  const toggleRemovePageSelection = useCallback(
    (rowIds: string[], select: boolean) => {
      setMembersToRemove((prev) => {
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

  const assignedTotal = members.length;
  const assignedTotalPages = Math.max(
    1,
    Math.ceil(assignedTotal / assignedPageSize),
  );
  const safeAssignedPage = Math.min(
    Math.max(1, assignedPage),
    assignedTotalPages,
  );

  useEffect(() => {
    if (assignedPage > assignedTotalPages) {
      setAssignedPage(assignedTotalPages);
    }
  }, [assignedPage, assignedTotalPages]);

  const assignedRows = useMemo(() => {
    const start = (safeAssignedPage - 1) * assignedPageSize;
    return members.slice(start, start + assignedPageSize);
  }, [members, safeAssignedPage, assignedPageSize]);

  const handleAssignedPageSizeChange = useCallback((n: number) => {
    setAssignedPageSize(n);
    setAssignedPage(1);
  }, []);

  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  const assignedColumns: PaginatedTableColumn<User>[] = useMemo(
    () => [
      {
        id: "username",
        header: "Username",
        cell: (m: User) =>
          projectId ? (
            <Link
              to={UI_PATHS.PROJECT_USER_PATIENTS(projectId, m.id)}
              className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
              title={m.username}
            >
              {m.username}
            </Link>
          ) : (
            <span className="block min-w-0 truncate">{m.username}</span>
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
        id: "patients",
        header: "Patients",
        cell: (m: User) => (
          <span
            className="tabular-nums text-[var(--text)]"
            title="Patients assigned to this member for this project"
          >
            {typeof m.assigned_patient_count === "number"
              ? m.assigned_patient_count
              : "—"}
          </span>
        ),
      },
      {
        id: "joined",
        header: "Joined",
        cell: (m: User) => (
          <span className="text-[var(--muted)]">
            {formatShortDate(m.date_joined)}
          </span>
        ),
      },
    ],
    [projectId],
  );

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

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--muted)]">Missing project id.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
      <nav className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]">
        <Link
          to={UI_PATHS.PROJECT(projectId)}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          ← Back to project
        </Link>
      </nav>
      <h2 className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
        Members
      </h2>

      {addMode ? (
        <AddMembers
          projectId={projectId}
          assignedMemberIds={memberIds}
          onClose={() => setAddMode(false)}
          onMembersAdded={fetchMembers}
        />
      ) : (
        <>
          <div className="mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
                Manage the team that works on this project.
              </h3>

              <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
                Select members below, then remove them from the project in one
                step.
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
                  onClick={() => void removeSelected()}
                  disabled={removeBusy || isMembersLoading}
                  className="min-h-9 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-3 text-xs font-semibold text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-soft))] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {removeBusy ? "Removing…" : "Remove"}
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

          <div className="mt-6 flex min-h-0 min-w-0 grow flex-col">
            {isMembersLoading ? (
              <div className="flex min-h-0 grow flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)] isolate">
                <div className="flex min-h-48 flex-1 items-center justify-center px-4 py-12 sm:min-h-64">
                  <Loading size="lg" />
                </div>
              </div>
            ) : (
              <PaginatedTable
                isLoading={false}
                columns={assignedColumns}
                rows={assignedRows}
                getRowId={(row) => row.id}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                pagination={{
                  page: safeAssignedPage,
                  pageSize: assignedPageSize,
                  total: assignedTotal,
                  onPageChange: setAssignedPage,
                  onPageSizeChange: handleAssignedPageSizeChange,
                }}
                selection={{
                  selectedIds: selectedRemoveSet,
                  onToggleRow: toggleRemoveRow,
                  onTogglePageRows: toggleRemovePageSelection,
                  headerToggleIds: memberIds,
                  disabled: removeBusy,
                }}
                emptyMessage="No members on this project yet."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectMembers;
