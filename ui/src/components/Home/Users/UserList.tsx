import { useMemo } from "react";
import { Link } from "react-router-dom";
import PaginatedTable, {
  type PaginatedTableColumn,
} from "../../PaginatedTable";
import type { User } from "../../../types/User";
import { formatShortDate } from "../../../utils/format";
import { UI_PATHS } from "../../../utils/urls";

type UserListProps = {
  onAddUser: () => void;
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
  onAddUser,
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
        id: "role",
        header: "Role",
        cell: (row) =>
          row.is_workspace_admin ? (
            <span className="text-[var(--text)]">Admin</span>
          ) : (
            <span className="text-[var(--muted)]">Member</span>
          ),
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Workspace
          </p>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Members
          </h2>
        </div>
        <button
          type="button"
          onClick={onAddUser}
          className="min-h-10 shrink-0 cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-[1.06] active:translate-y-px active:brightness-95"
        >
          Add user
        </button>
      </div>

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
  );
}

export default UserList;
