import axios from "axios";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_PATHS, UI_PATHS } from "../../../../../utils/urls";
import type { PatientRow } from "../../../../../types/Patient";
import apiClient from "../../../../../utils/apiClient";
import Loading from "../../../../Loading";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../../PaginatedTable";
import { formatShortDate } from "../../../../../utils/format";
import { toastError, toastSuccess } from "../../../../../utils/toast";
import { AuthContext } from "../../../../../contexts/auth/authContext";
import PenIcon from "../../../../../icons/PenIcon";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../../../../utils/constants";
import AddPatients from "./ManagePatients";

function display(value: string | null | undefined) {
  if (value == null || value === "") return "—";

  return value;
}

function ProjectPatients() {
  const { projectId } = useParams();

  const { user } = useContext(AuthContext);

  const canManage = Boolean(user?.is_workspace_admin);

  const [isPatientsLoading, setIsPatientsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsToRemove, setPatientsToRemove] = useState<string[]>([]);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(DEFAULT_PAGE_SIZE);

  const selectedRemoveSet = useMemo(
    () => new Set(patientsToRemove),
    [patientsToRemove],
  );

  const fetchPatients = useCallback(() => {
    if (!projectId) return Promise.resolve();

    setIsPatientsLoading(true);

    return apiClient
      .get<PatientRow[]>(API_PATHS.PROJECT_PATIENTS(projectId))
      .then((response) => {
        setPatients(response.data);
      })
      .catch(() => {
        setPatients([]);
        toastError("Could not load project patients.");
      })
      .finally(() => {
        setIsPatientsLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const enterAddMode = () => {
    setPatientsToRemove([]);
    setAddMode(true);
  };

  const toggleRemoveRow = (id: string) => {
    setPatientsToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const cancelRemoval = () => setPatientsToRemove([]);

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

  const assignedTotal = patients.length;
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
    return patients.slice(start, start + assignedPageSize);
  }, [patients, safeAssignedPage, assignedPageSize]);

  const handleAssignedPageSizeChange = useCallback((n: number) => {
    setAssignedPageSize(n);
    setAssignedPage(1);
  }, []);

  const patientIds = useMemo(() => patients.map((p) => p.id), [patients]);

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
            target="_blank"
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
      {
        id: "actions",
        header: "Actions",
        cell: (p: PatientRow) =>
          projectId ? (
            <Link
              to={UI_PATHS.VIEWER({
                patientId: p.id,
                projectId: projectId,
              })}
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
            >
              <PenIcon className="size-4 shrink-0" />
              Annotate
            </Link>
          ) : null,
      },
    ],
    [projectId],
  );

  const removeSelected = async () => {
    if (!projectId || patientsToRemove.length === 0 || removeBusy) return;

    setRemoveBusy(true);

    try {
      await apiClient.delete(API_PATHS.PROJECT_PATIENTS(projectId), {
        data: { patient_ids: patientsToRemove },
      });

      toastSuccess(
        patientsToRemove.length === 1
          ? "Removed 1 patient from the project."
          : `Removed ${patientsToRemove.length} patients from the project.`,
      );

      setPatientsToRemove([]);

      await fetchPatients();
    } catch (err) {
      let msg = "Could not remove patients.";

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
      <div className="flex h-full items-center justify-center p-4 sm:p-6">
        <p className="text-sm text-[var(--muted)]">Missing project id.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-6">
      <nav className="mb-6 shrink-0 text-xs font-medium text-[var(--muted)]">
        <Link
          to={UI_PATHS.PROJECT(projectId)}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          ← Back to project
        </Link>
      </nav>

      <h2 className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
        Patients
      </h2>

      {addMode && canManage ? (
        <AddPatients
          projectId={projectId}
          assignedPatientIds={patientIds}
          onClose={() => setAddMode(false)}
          onPatientsAdded={fetchPatients}
        />
      ) : (
        <>
          <div className="mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
                Manage cases linked to this project.
              </h3>

              <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
                {!canManage
                  ? "Patients you can access for this project are listed below."
                  : "Select patients below, then remove them from the project in one step."}
              </p>
            </div>

            {canManage ? (
              patientsToRemove.length > 0 ? (
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
                    disabled={removeBusy || isPatientsLoading}
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
                    disabled={isPatientsLoading || removeBusy}
                    className="min-h-9 shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add patients
                  </button>
                </div>
              )
            ) : null}
          </div>

          <div className="mt-6 flex min-h-0 min-w-0 grow flex-col">
            {isPatientsLoading ? (
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
                selection={
                  canManage
                    ? {
                        selectedIds: selectedRemoveSet,
                        onToggleRow: toggleRemoveRow,
                        onTogglePageRows: toggleRemovePageSelection,
                        headerToggleIds: patientIds,
                        disabled: removeBusy,
                      }
                    : undefined
                }
                emptyMessage="No patients on this project yet."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectPatients;
