import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PatientRow } from "../../../../../../types/Patient";
import { API_PATHS, UI_PATHS } from "../../../../../../utils/urls";
import apiClient from "../../../../../../utils/apiClient";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../../../PaginatedTable";
import { formatShortDate } from "../../../../../../utils/format";
import { toastError, toastSuccess } from "../../../../../../utils/toast";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../../../../../utils/constants";

function display(value: string | null | undefined) {
  if (value == null || value === "") return "—";
  return value;
}

export type AssignPatientsProps = {
  projectId: string;
  userId: string;
  /** Patient ids already assigned to this member — excluded from picker */
  assignedPatientIds: readonly string[];
  memberUsername: string | null;
  memberLoading: boolean;
  onClose: () => void;
  /** Refresh assigned patients after successful POST */
  onAssigned: () => Promise<void>;
};

export default function AssignPatients({
  projectId,
  userId,
  assignedPatientIds,
  memberUsername,
  memberLoading,
  onClose,
  onAssigned,
}: AssignPatientsProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [projectPatients, setProjectPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const assignedSet = useMemo(
    () => new Set(assignedPatientIds),
    [assignedPatientIds],
  );

  const availableToAssign = useMemo(
    () => projectPatients.filter((p) => !assignedSet.has(p.id)),
    [projectPatients, assignedSet],
  );

  const totalPages = Math.max(1, Math.ceil(availableToAssign.length / pageSize));

  const displayRows = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return availableToAssign.slice(start, start + pageSize);
  }, [availableToAssign, page, pageSize, totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);

  const exit = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiClient
      .get<PatientRow[]>(API_PATHS.PROJECT_PATIENTS(projectId), {
        signal: controller.signal,
      })
      .then((response) => {
        setProjectPatients(response.data);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setProjectPatients([]);
        toastError("Could not load project patients.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [projectId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePageSizeChange = useCallback((n: number) => {
    setPageSize(n);
    setPage(1);
  }, []);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePageRows = useCallback(
    (rowIds: string[], select: boolean) => {
      setSelectedIds((prev) => {
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

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const columns: PaginatedTableColumn<PatientRow>[] = useMemo(
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

  const assignSelected = async () => {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    try {
      await apiClient.post(API_PATHS.PROJECT_USER_PATIENTS(projectId, userId), {
        patient_ids: selectedIds,
      });
      toastSuccess(`Assigned ${selectedIds.length - assignedPatientIds.length} patient/s.`);
      exit();
      await onAssigned();
    } catch (err) {
      let msg = "Could not assign patients.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      toastError(msg);
    } finally {
      setBusy(false);
    }
  };

  const memberLabel = memberLoading ? "…" : (memberUsername ?? "");

  return (
    <>
      <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
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
            Choose patients from this project that this member may work on.
            Only patients already on the project are listed.
          </p>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={exit}
              disabled={busy}
              className="min-h-8 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void assignSelected()}
              disabled={busy || loading}
              className="min-h-8 w-16 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:w-20 sm:px-3"
            >
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={exit}
              disabled={busy || loading}
              className="min-h-8 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex min-h-0 min-w-0 grow flex-col overflow-hidden bg-[color:var(--surface)] sm:mt-6">
        <PaginatedTable
          isLoading={loading}
          columns={columns}
          rows={displayRows}
          getRowId={(row) => row.id}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pagination={{
            page: safePage,
            pageSize,
            total: availableToAssign.length,
            onPageChange: setPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          selection={{
            selectedIds: selectedSet,
            onToggleRow: toggleRow,
            onTogglePageRows: togglePageRows,
            disabled: busy,
          }}
        />
      </div>
    </>
  );
}
