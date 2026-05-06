import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { PatientRow } from "../../../../../types/Patient";
import type { PaginatedResponse } from "../../../../../types/PaginatedResponse";
import { API_PATHS, UI_PATHS } from "../../../../../utils/urls";
import apiClient from "../../../../../utils/apiClient";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../../../PaginatedTable";
import { formatShortDate } from "../../../../../utils/format";
import { toastError, toastSuccess } from "../../../../../utils/toast";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../../../../utils/constants";
import PatientFilters from "../../../Filters/PatientFilters";

function display(value: string | null | undefined) {
  if (value == null || value === "") return "—";

  return value;
}

export type AddPatientsProps = {
  projectId: string;
  assignedPatientIds: readonly string[];
  onClose: () => void;
  onPatientsAdded: () => Promise<void>;
};

export default function AddPatients({
  projectId,
  assignedPatientIds,
  onClose,
  onPatientsAdded,
}: AddPatientsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(
    searchParams.get("page_size") || DEFAULT_PAGE_SIZE.toString(),
  );
  const search = searchParams.get("search") || "";
  const ageRange = searchParams.get("age_range") || "";
  const gender = searchParams.get("gender") || "";

  const [workspaceAddRows, setWorkspaceAddRows] = useState<PatientRow[]>([]);
  const [workspaceAddTotal, setWorkspaceAddTotal] = useState(0);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedAddIds, setSelectedAddIds] = useState<string[]>(
    assignedPatientIds.map((id) => id.toString()),
  );
  const [addBusy, setAddBusy] = useState(false);

  const selectedAddSet = useMemo(
    () => new Set(selectedAddIds),
    [selectedAddIds],
  );

  const exitAddMode = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitAddMode();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [exitAddMode]);

  useEffect(() => {
    const controller = new AbortController();
    setPatientsLoading(true);

    apiClient
      .get<PaginatedResponse<PatientRow>>(
        API_PATHS.PATIENTS({
          page,
          page_size: pageSize,
          search: search,
          age_range: ageRange,
          gender: gender,
        }),
        { signal: controller.signal },
      )
      .then(({ data }) => {
        setWorkspaceAddRows(data.results);
        setWorkspaceAddTotal(data.total);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setWorkspaceAddRows([]);
        setWorkspaceAddTotal(0);
        toastError("Could not load workspace patients.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPatientsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [page, pageSize, search, ageRange, gender]);

  const handlePageSizeChange = (next: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page_size", String(next));
      params.set("page", "1");
      return params;
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", page.toString());
      return params;
    });
  };

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
    ],
    [],
  );

  const addSelected = async () => {
    if (selectedAddIds.length === 0 || addBusy) return;

    setAddBusy(true);

    try {
      await apiClient.post(API_PATHS.PROJECT_PATIENTS(projectId), {
        patient_ids: selectedAddIds,
      });

      toastSuccess(
        selectedAddIds.length === 1
          ? "Added 1 patient."
          : `Added ${selectedAddIds.length} patients.`,
      );

      exitAddMode();

      await onPatientsAdded();
    } catch (err) {
      let msg = "Could not add patients.";

      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };

        if (typeof d.detail === "string") msg = d.detail;
      }

      toastError(msg);
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <>
      <div className="mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
            Manage cases linked to this project.
          </h3>

          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Select workspace patients below, then add them to this project.
          </p>
        </div>

        {selectedAddIds.length > 0 ? (
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
              disabled={addBusy || patientsLoading}
              className="min-h-9 w-20 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {addBusy ? "Adding…" : "Add"}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={exitAddMode}
              disabled={addBusy || patientsLoading}
              className="min-h-9 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="my-3 shrink-0">
        <PatientFilters />
      </div>

      <div className="flex min-h-0 min-w-0 grow flex-col">
        <PaginatedTable
          isLoading={patientsLoading}
          columns={addModeColumns}
          rows={workspaceAddRows}
          getRowId={(row) => row.id}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pagination={{
            page: page,
            pageSize: pageSize,
            total: workspaceAddTotal,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          selection={{
            selectedIds: selectedAddSet,
            onToggleRow: toggleAddRow,
            onTogglePageRows: toggleAddPageSelection,
            disabled: addBusy,
          }}
        />
      </div>
    </>
  );
}
