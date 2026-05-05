import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../PaginatedTable";
import type { Project } from "../../../types/Project";
import { formatShortDate } from "../../../utils/format";
import { UI_PATHS } from "../../../utils/urls";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import { AuthContext } from "../../../contexts/auth/authContext";

type ProjectListProps = {
  onAddProject: () => void;
  isProjectsLoading: boolean;
  projects: PaginatedResponse<Project>;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: readonly number[];
};

function ProjectList({
  onAddProject,
  isProjectsLoading,
  projects,
  page,
  setPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}: ProjectListProps) {
  const { user } = useContext(AuthContext);

  const total = projects.total;
  const pageRows = projects.results;

  const columns: PaginatedTableColumn<Project>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <Link
            to={UI_PATHS.PROJECT(row.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={row.name}
          >
            {row.name}
          </Link>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: (row) =>
          row.description ? (
            <span
              className="block min-w-0 w-full truncate text-[var(--muted)]"
              title={row.description}
            >
              {row.description}
            </span>
          ) : (
            <span className="text-[var(--muted)]">—</span>
          ),
      },
      {
        id: "members",
        header: "Members",
        cell: (row) => row.member_count,
      },
      {
        id: "patients",
        header: "Patients",
        cell: (row) => row.patient_count,
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
    <div className="h-full flex flex-col overflow-hidden p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Workspace
          </p>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Projects
          </h2>
        </div>
        {user?.is_workspace_admin && (
          <button
            type="button"
            onClick={onAddProject}
            className="min-h-10 shrink-0 cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-[1.06] active:translate-y-px active:brightness-95"
          >
            Add project
          </button>
        )}
      </div>

      <PaginatedTable
        isLoading={isProjectsLoading}
        columns={columns}
        rows={pageRows}
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

export default ProjectList;
