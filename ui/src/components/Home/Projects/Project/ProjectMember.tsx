import axios from "axios";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../../../../contexts/auth/authContext";
import type { PatientRow } from "../../../../types/Patient";
import type { User } from "../../../../types/User";
import apiClient from "../../../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import Loading from "../../../Loading";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../PaginatedTable";
import { formatShortDate } from "../../../../utils/format";
import { toastError, toastSuccess } from "../../../../utils/toast";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

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
  const [addPage, setAddPage] = useState(1);
  const [addPageSize, setAddPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [projectPatients, setProjectPatients] = useState<PatientRow[]>([]);
  const [projectPatientsLoading, setProjectPatientsLoading] = useState(false);
  const [selectedAddIds, setSelectedAddIds] = useState<string[]>([]);
  const [addBusy, setAddBusy] = useState(false);

  const removeHeaderRef = useRef<HTMLInputElement>(null);

  const selectedRemoveSet = useMemo(
    () => new Set(patientsToRemove),
    [patientsToRemove],
  );

  const selectedAddSet = useMemo(
    () => new Set(selectedAddIds),
    [selectedAddIds],
  );

  const assignedIdSet = useMemo(
    () => new Set(assignedPatients.map((p) => p.id)),
    [assignedPatients],
  );

  const availableToAssign = useMemo(
    () => projectPatients.filter((p) => !assignedIdSet.has(p.id)),
    [projectPatients, assignedIdSet],
  );

  const addTotalPages = Math.max(
    1,
    Math.ceil(availableToAssign.length / addPageSize),
  );

  const displayAddRows = useMemo(() => {
    const start = (addPage - 1) * addPageSize;
    return availableToAssign.slice(start, start + addPageSize);
  }, [availableToAssign, addPage, addPageSize]);

  const exitAddMode = useCallback(() => {
    setAddMode(false);
    setSelectedAddIds([]);
    setAddPage(1);
    setProjectPatients([]);
  }, []);

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

  useEffect(() => {
    if (!addMode || !canManage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitAddMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addMode, canManage, exitAddMode]);

  useEffect(() => {
    const el = removeHeaderRef.current;
    if (!el || addMode || !canManage) return;
    const n = assignedPatients.length;
    const sel = selectedRemoveSet.size;
    el.indeterminate = n > 0 && sel > 0 && sel < n;
    el.checked = n > 0 && sel === n;
  }, [addMode, canManage, assignedPatients, selectedRemoveSet]);

  const fetchProjectPatientsForAdd = useCallback(() => {
    if (!projectId) return Promise.resolve();
    setProjectPatientsLoading(true);
    return apiClient
      .get<PatientRow[]>(API_PATHS.PROJECT_PATIENTS(projectId))
      .then((response) => {
        setProjectPatients(response.data);
      })
      .catch(() => {
        setProjectPatients([]);
        toastError("Could not load project patients.");
      })
      .finally(() => {
        setProjectPatientsLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!addMode || !canManage) return;
    if (addPage > addTotalPages) {
      setAddPage(addTotalPages);
    }
  }, [addMode, canManage, addPage, addTotalPages]);

  const handleAddPageSizeChange = useCallback((n: number) => {
    setAddPageSize(n);
    setAddPage(1);
  }, []);

  const enterAddMode = () => {
    setPatientsToRemove([]);
    setAddMode(true);
    setSelectedAddIds([]);
    setAddPage(1);
    void fetchProjectPatientsForAdd();
  };

  const toggleRemoveRow = (id: string) => {
    setPatientsToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllRemove = () => {
    if (selectedRemoveSet.size === assignedPatients.length) {
      setPatientsToRemove([]);
    } else {
      setPatientsToRemove(assignedPatients.map((p) => p.id));
    }
  };

  const cancelRemoval = () => setPatientsToRemove([]);

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

  const addModeColumns: PaginatedTableColumn<PatientRow>[] = useMemo(
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
        header: "—",
        cell: (p: PatientRow) => (
          <span className="text-[var(--muted)]">
            {formatShortDate(p.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const addSelected = async () => {
    if (!projectId || !userId || selectedAddIds.length === 0 || addBusy) return;
    setAddBusy(true);
    try {
      await apiClient.post(API_PATHS.PROJECT_USER_PATIENTS(projectId, userId), {
        patient_ids: selectedAddIds,
      });
      toastSuccess(
        selectedAddIds.length === 1
          ? "Assigned 1 patient."
          : `Assigned ${selectedAddIds.length} patients.`,
      );
      exitAddMode();
      await fetchAssigned();
    } catch (err) {
      let msg = "Could not assign patients.";
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
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--muted)]">
          Missing project or user id.
        </p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
        <nav className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]">
          <Link
            to={UI_PATHS.PROJECT_MEMBERS(projectId)}
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            ← Back to members
          </Link>
        </nav>
        <h2 className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
          Member patients
        </h2>
        <p className="mt-4 max-w-lg text-sm text-[var(--muted)]">
          Only workspace administrators can view or change which patients are
          assigned to each project member.
        </p>
      </div>
    );
  }

  const memberLabel = memberLoading ? "…" : member ? member.username : "Member";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
      <nav className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]">
        <Link
          to={UI_PATHS.PROJECT_MEMBERS(projectId)}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          ← Back to members
        </Link>
      </nav>

      <h2 className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
        Member patients
      </h2>

      <div className="mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
            Patient access for{" "}
            <Link
              to={UI_PATHS.USER(userId)}
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {memberLabel}
            </Link>
          </h3>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            {addMode
              ? "Choose patients from this project that this member may work on. Only patients already on the project are listed."
              : "Assigned patients define which cases this member can access for this project. Select rows to remove assignments in one step."}
          </p>
        </div>

        {patientsToRemove.length > 0 ? (
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
              disabled={removeBusy || isAssignedLoading}
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
              disabled={addBusy || projectPatientsLoading}
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
              disabled={addBusy || projectPatientsLoading}
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
              disabled={isAssignedLoading || removeBusy}
              className="min-h-9 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Assign patients
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex min-h-0 grow flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[color:var(--surface)]">
        {!addMode && isAssignedLoading ? (
          <div className="flex h-full items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : addMode ? (
          <PaginatedTable
            isLoading={projectPatientsLoading}
            columns={addModeColumns}
            rows={displayAddRows}
            getRowId={(row) => row.id}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pagination={{
              page: addPage,
              pageSize: addPageSize,
              total: availableToAssign.length,
              onPageChange: setAddPage,
              onPageSizeChange: handleAddPageSizeChange,
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
                      disabled={assignedPatients.length === 0 || removeBusy}
                      onChange={toggleSelectAllRemove}
                      className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                      aria-label="Select all assigned patients"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Patient ID
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Sex
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Age
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] last:pr-4">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignedPatients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-14 text-center text-sm text-[var(--muted)]"
                    >
                      No patients assigned to this member yet.
                    </td>
                  </tr>
                ) : (
                  assignedPatients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--border)] transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)]"
                    >
                      <td className="px-3 py-2.5 text-center align-middle first:pl-4">
                        <input
                          type="checkbox"
                          checked={selectedRemoveSet.has(p.id)}
                          onChange={() => toggleRemoveRow(p.id)}
                          disabled={removeBusy}
                          className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                          aria-label={`Select ${p.PatientID}`}
                        />
                      </td>
                      <td className="max-w-0 min-w-0 overflow-hidden px-3 py-2.5 font-medium">
                        <Link
                          to={UI_PATHS.PATIENT(p.id)}
                          className="block min-w-0 truncate text-[var(--accent)] underline-offset-2 hover:underline"
                          title={p.PatientID}
                        >
                          {p.PatientID}
                        </Link>
                      </td>
                      <td className="max-w-0 min-w-0 overflow-hidden px-3 py-2.5 text-[var(--text)]">
                        <span
                          className="block min-w-0 truncate"
                          title={p.PatientName ?? undefined}
                        >
                          {display(p.PatientName)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm text-[var(--muted)]">
                        {display(p.PatientSex)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm text-[var(--muted)]">
                        {display(p.PatientAge)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm text-[var(--text)] last:pr-4">
                        {formatShortDate(p.created_at)}
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

export default ProjectMember;
