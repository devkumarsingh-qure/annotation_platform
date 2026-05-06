import { useMemo } from "react";
import { Link } from "react-router-dom";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../PaginatedTable";
import type { Project } from "../../../types/Project";
import { formatShortDate } from "../../../utils/format";
import { UI_PATHS } from "../../../utils/urls";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";

type ProjectListProps = {
  isProjectsLoading: boolean;
  projects: PaginatedResponse<Project>;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: readonly number[];
};

function ProjectList({
  isProjectsLoading,
  projects,
  page,
  setPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}: ProjectListProps) {
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
    <div className="flex h-full flex-col overflow-hidden">
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
