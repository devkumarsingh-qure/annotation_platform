import axios from "axios";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../../../../../contexts/auth/authContext";
import type { PatientRow } from "../../../../../../types/Patient";
import type { User } from "../../../../../../types/User";
import apiClient from "../../../../../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../../../../../utils/urls";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../../../PaginatedTable";
import { formatShortDate } from "../../../../../../utils/format";
import { toastError, toastSuccess } from "../../../../../../utils/toast";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../../../../../utils/constants";
import AssignPatients from "./AssignPatients";

function display(value: string | null | undefined) {
  if (value == null || value === "") return "—";
  return value;
}

function ProjectMember() {
  const { projectId, userId } = useParams();
  const { user } = useContext(AuthContext);
  const canManage = Boolean(user?.is_workspace_admin);

  const [member, setMember] = useState<User | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [isAssignedLoading, setIsAssignedLoading] = useState(true);
  const [assignedPatients, setAssignedPatients] = useState<PatientRow[]>([]);
  const [patientsToRemove, setPatientsToRemove] = useState<string[]>([]);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(DEFAULT_PAGE_SIZE);

  const selectedRemoveSet = useMemo(
    () => new Set(patientsToRemove),
    [patientsToRemove],
  );

  const assignedIds = useMemo(
    () => assignedPatients.map((p) => p.id),
    [assignedPatients],
  );

  const fetchMember = useCallback(() => {
    if (!projectId || !userId || !canManage) return Promise.resolve();
    setMemberLoading(true);
    return apiClient
      .get<User>(API_PATHS.PROJECT_USER(projectId, userId))
      .then((response) => {
        setMember(response.data);
      })
      .catch(() => {
        setMember(null);
        toastError("Could not load project member.");
      })
      .finally(() => {
        setMemberLoading(false);
      });
  }, [projectId, userId, canManage]);

  const fetchAssigned = useCallback(() => {
    if (!projectId || !userId || !canManage) return Promise.resolve();
    setIsAssignedLoading(true);
    return apiClient
      .get<PatientRow[]>(API_PATHS.PROJECT_USER_PATIENTS(projectId, userId))
      .then((response) => {
        setAssignedPatients(response.data);
      })
      .catch(() => {
        setAssignedPatients([]);
        toastError("Could not load patients assigned to this member.");
      })
      .finally(() => {
        setIsAssignedLoading(false);
      });
  }, [projectId, userId, canManage]);

  useEffect(() => {
    if (!canManage) return;
    void fetchMember();
    void fetchAssigned();
  }, [canManage, fetchMember, fetchAssigned]);

  const assignedTotal = assignedPatients.length;
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
    return assignedPatients.slice(start, start + assignedPageSize);
  }, [assignedPatients, safeAssignedPage, assignedPageSize]);

  const handleAssignedPageSizeChange = useCallback((n: number) => {
    setAssignedPageSize(n);
    setAssignedPage(1);
  }, []);

  const enterAddMode = () => {
    setPatientsToRemove([]);
    setAddMode(true);
  };

  const toggleRemoveRow = (id: string) => {
    setPatientsToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleRemovePageSelection = useCallback(
    (rowIds: string[], select: boolean) => {
      setPatientsToRemove((prev) => {
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

  const cancelRemoval = () => setPatientsToRemove([]);

  const assignedColumns: PaginatedTableColumn<PatientRow>[] = useMemo(
    () => [
      {
        id: "patientId",
        header: "Patient ID",
        cell: (p: PatientRow) => (
          <Link
            to={UI_PATHS.PATIENT(p.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={p.PatientID}
          >
            {p.PatientID}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: (p: PatientRow) => (
          <span
            className="block min-w-0 w-full truncate text-[var(--text)]"
            title={p.PatientName ?? undefined}
          >
            {display(p.PatientName)}
          </span>
        ),
      },
      {
        id: "sex",
        header: "Sex",
        cell: (p: PatientRow) => (
          <span className="text-[var(--muted)]">{display(p.PatientSex)}</span>
        ),
      },
      {
        id: "age",
        header: "Age",
        cell: (p: PatientRow) => (
          <span className="text-[var(--muted)]">{display(p.PatientAge)}</span>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: (p: PatientRow) => (
          <span className="text-[var(--muted)]">
            {formatShortDate(p.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const removeSelected = async () => {
    if (!projectId || !userId || patientsToRemove.length === 0 || removeBusy)
      return;
    setRemoveBusy(true);
    try {
      await apiClient.delete(
        API_PATHS.PROJECT_USER_PATIENTS(projectId, userId),
        { data: { patient_ids: patientsToRemove } },
      );
      toastSuccess(
        patientsToRemove.length === 1
          ? "Removed 1 patient assignment."
          : `Removed ${patientsToRemove.length} patient assignments.`,
      );
      setPatientsToRemove([]);
      await fetchAssigned();
    } catch (err) {
      let msg = "Could not remove assignments.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      toastError(msg);
    } finally {
      setRemoveBusy(false);
    }
  };

  if (!projectId || !userId) {
    return (
      <div className="flex h-full items-center justify-center p-4 sm:p-6">
        <p className="text-sm text-[var(--muted)]">
          Missing project or user id.
        </p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-6">
        <nav className="mb-3 shrink-0 text-xs font-medium text-[var(--muted)] sm:mb-6">
          <Link
            to={UI_PATHS.PROJECT_MEMBERS(projectId)}
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            ← Back to members
          </Link>
        </nav>
        <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-base">
          Member patients
        </h2>
        <p className="mt-2 max-w-lg text-xs leading-snug text-[var(--muted)] sm:mt-4 sm:text-sm">
          Only workspace administrators can view or change which patients are
          assigned to each project member.
        </p>
      </div>
    );
  }

  const memberLabel = memberLoading ? "…" : (member?.username ?? "");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-6">
      <nav className="mb-3 shrink-0 text-xs font-medium text-[var(--muted)] sm:mb-6">
        <Link
          to={UI_PATHS.PROJECT_MEMBERS(projectId)}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          ← Back to members
        </Link>
      </nav>

      <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-base">
        Member patients
      </h2>

      {addMode ? (
        <AssignPatients
          projectId={projectId}
          userId={userId}
          assignedPatientIds={assignedIds}
          memberUsername={member?.username ?? null}
          memberLoading={memberLoading}
          onClose={() => setAddMode(false)}
          onAssigned={fetchAssigned}
        />
      ) : (
        <>
          <div className="mt-2 flex shrink-0 flex-col gap-2 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-[var(--text)] sm:text-base">
                Patient access for{" "}
                <Link
                  to={UI_PATHS.USER(userId)}
                  className="text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  {memberLabel}
                </Link>
              </h3>
              <p className="mt-0.5 max-w-xl text-xs leading-snug text-[var(--muted)] sm:mt-1 sm:text-sm">
                Assigned patients define which cases this member can access for
                this project. Select rows to remove assignments in one step.
              </p>
            </div>

            {patientsToRemove.length > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={cancelRemoval}
                  disabled={removeBusy}
                  className="min-h-8 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void removeSelected()}
                  disabled={removeBusy || isAssignedLoading}
                  className="min-h-8 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-2.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-soft))] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
                >
                  {removeBusy ? "Removing…" : "Remove"}
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={enterAddMode}
                  disabled={isAssignedLoading || removeBusy}
                  className="min-h-8 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
                >
                  Assign patients
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex min-h-0 min-w-0 grow flex-col sm:mt-6">
            <PaginatedTable
              isLoading={isAssignedLoading}
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
                headerToggleIds: assignedIds,
                disabled: removeBusy,
              }}
              emptyMessage="No patients assigned to this member yet."
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectMember;
