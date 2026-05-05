import { useMemo } from "react";
import { Link } from "react-router-dom";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../PaginatedTable";
import type { PatientRow } from "../../../types/Patient";
import { formatShortDate } from "../../../utils/format";
import { UI_PATHS } from "../../../utils/urls";

type PatientListProps = {
  isLoading: boolean;
  patients: PatientRow[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: readonly number[];
};

function display(value: string | null | undefined) {
  if (value == null || value === "") return "—";
  return value;
}

function PatientList({
  isLoading,
  patients,
  total,
  page,
  setPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}: PatientListProps) {
  const columns: PaginatedTableColumn<PatientRow>[] = useMemo(
    () => [
      {
        id: "patientId",
        header: "Patient ID",
        cell: (row) => (
          <Link
            to={UI_PATHS.PATIENT(row.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={row.PatientID}
          >
            {row.PatientID}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <span
            className="block min-w-0 w-full truncate text-[var(--text)]"
            title={row.PatientName ?? undefined}
          >
            {display(row.PatientName)}
          </span>
        ),
      },
      {
        id: "sex",
        header: "Sex",
        cell: (row) => (
          <span className="text-[var(--muted)]">{display(row.PatientSex)}</span>
        ),
      },
      {
        id: "age",
        header: "Age",
        cell: (row) => (
          <span className="text-[var(--muted)]">{display(row.PatientAge)}</span>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => formatShortDate(row.created_at),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-6 py-7">
      <header className="mb-7 shrink-0 border-b border-[color-mix(in_srgb,var(--border)_75%,transparent)] pb-7">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Directory
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Patients
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[color-mix(in_srgb,var(--muted)_95%,var(--text))]">
            Patients available in your workspace—open a record for details or to
            launch the viewer when you have access.
          </p>
        </div>
      </header>

      <PaginatedTable
        isLoading={isLoading}
        columns={columns}
        rows={patients}
        getRowId={(row) => row.id}
        pageSizeOptions={pageSizeOptions}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange,
        }}
      />
    </div>
  );
}

export default PatientList;
