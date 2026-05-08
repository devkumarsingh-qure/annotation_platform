import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../PaginatedTable";
import type { User } from "../../../types/User";
import { formatShortDate } from "../../../utils/format";
import { UI_PATHS } from "../../../utils/urls";
import PageOverviewHeader from "../PageOverviewHeader";

type UserListProps = {
  overviewTitle: string;
  overviewDescription: string;
  overviewAction?: ReactNode;
  filters: ReactNode;
  isLoading: boolean;
  /** Current page rows from the server */
  users: User[];
  /** Total users in the workspace (from API) */
  total: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: readonly number[];
};

function UserList({
  overviewTitle,
  overviewDescription,
  overviewAction,
  filters,
  isLoading,
  users,
  total,
  page,
  setPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}: UserListProps) {
  const columns: PaginatedTableColumn<User>[] = useMemo(
    () => [
      {
        id: "username",
        header: "Username",
        cell: (row) => (
          <Link
            to={UI_PATHS.USER(row.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={row.username}
          >
            {row.username}
          </Link>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (row) => {
          const raw = row.email?.trim();
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
        id: "active",
        header: "Active",
        cell: (row) => (row.is_active ? "Yes" : "No"),
      },
      {
        id: "joined",
        header: "Joined",
        cell: (row) => formatShortDate(row.date_joined),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageOverviewHeader
        title={overviewTitle}
        description={overviewDescription}
        action={overviewAction}
      />
      <div className="mb-2 shrink-0 sm:mb-3">{filters}</div>
      <div className="min-h-0 grow flex flex-col overflow-hidden">
        <PaginatedTable
          isLoading={isLoading}
          columns={columns}
          rows={users}
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
    </div>
  );
}

export default UserList;
