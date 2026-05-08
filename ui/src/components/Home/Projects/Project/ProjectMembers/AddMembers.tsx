import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { PaginatedResponse } from "../../../../../types/PaginatedResponse";
import type { User } from "../../../../../types/User";
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
import UserFilters from "../../../Filters/UserFilters";

export type AddMembersProps = {
  projectId: string;
  /** Already project members — excluded from picker display */
  assignedMemberIds: readonly string[];
  onClose: () => void;
  onMembersAdded: () => Promise<void>;
};

export default function AddMembers({
  projectId,
  assignedMemberIds,
  onClose,
  onMembersAdded,
}: AddMembersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(
    searchParams.get("page_size") || DEFAULT_PAGE_SIZE.toString(),
  );
  const search = searchParams.get("search") || "";
  const activeRaw = searchParams.get("active") || "";
  const activeFilter: "true" | "false" | undefined =
    activeRaw === "true" || activeRaw === "false" ? activeRaw : undefined;

  const [workspaceAddRows, setWorkspaceAddRows] = useState<User[]>([]);
  const [workspaceAddTotal, setWorkspaceAddTotal] = useState(0);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [selectedAddIds, setSelectedAddIds] = useState<string[]>(assignedMemberIds.map((id) => id.toString()));
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
    setWorkspaceLoading(true);

    apiClient
      .get<PaginatedResponse<User>>(
        API_PATHS.USERS({
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          active: activeFilter,
        }),
        { signal: controller.signal },
      )
      .then(({ data }) => {
        setWorkspaceAddRows(data.results);
        setWorkspaceAddTotal(data.total);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setWorkspaceAddRows([]);
        setWorkspaceAddTotal(0);
        toastError("Could not load workspace users.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setWorkspaceLoading(false);
      });

    return () => controller.abort();
  }, [page, pageSize, search, activeFilter]);

  const handlePageSizeChange = (next: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page_size", String(next));
      params.set("page", "1");
      return params;
    });
  };

  const handlePageChange = (nextPage: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(nextPage));
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

  const columns: PaginatedTableColumn<User>[] = useMemo(
    () => [
      {
        id: "username",
        header: "Username",
        cell: (m: User) => (
          <Link
            to={UI_PATHS.USER(m.id)}
            className="block min-w-0 w-full truncate text-[var(--accent)] underline-offset-2 hover:underline"
            title={m.username}
          >
            {m.username}
          </Link>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (m: User) => {
          const raw = m.email?.trim();
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
        cell: (m: User) =>
          m.is_workspace_admin ? (
            <span className="rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-soft))] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              Admin
            </span>
          ) : (
            <span className="text-[var(--muted)]">Member</span>
          ),
      },
      {
        id: "joined",
        header: "Joined",
        cell: (m: User) => (
          <span className="text-[var(--muted)]">
            {formatShortDate(m.date_joined)}
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
      await apiClient.post(API_PATHS.PROJECT_USERS(projectId), {
        user_ids: selectedAddIds,
      });

      toastSuccess(`Added ${selectedAddIds.length - assignedMemberIds.length} member/s.`);

      exitAddMode();

      await onMembersAdded();
    } catch (err) {
      let msg = "Could not add members.";

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
      <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-[var(--text)] sm:text-base">
            Manage the team that works on this project.
          </h3>

          <p className="mt-0.5 max-w-xl text-xs leading-snug text-[var(--muted)] sm:mt-1 sm:text-sm">
            Select workspace users below, then add them to this project.
          </p>
        </div>

        {selectedAddIds.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={exitAddMode}
              disabled={addBusy}
              className="min-h-8 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void addSelected()}
              disabled={addBusy || workspaceLoading}
              className="min-h-8 w-16 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 text-xs font-semibold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:w-20 sm:px-3"
            >
              {addBusy ? "Adding…" : "Add"}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={exitAddMode}
              disabled={addBusy || workspaceLoading}
              className="min-h-8 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="my-2 shrink-0 sm:my-3">
        <UserFilters />
      </div>

      <div className="flex min-h-0 min-w-0 grow flex-col">
        <PaginatedTable
          isLoading={workspaceLoading}
          columns={columns}
          rows={workspaceAddRows}
          getRowId={(row) => row.id}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pagination={{
            page,
            pageSize,
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
