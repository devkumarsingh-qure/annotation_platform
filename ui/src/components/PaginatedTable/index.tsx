import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import Loading from "../Loading";

export type PaginatedTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

export type PaginatedTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export type PaginatedTableSelection = {
  selectedIds: ReadonlySet<string>;
  onToggleRow: (id: string) => void;
  onTogglePageRows: (rowIds: string[], select: boolean) => void;
  disabled?: boolean;
  /** When set, the header checkbox toggles these ids (e.g. the full dataset) instead of only the current page. */
  headerToggleIds?: readonly string[];
};

export type PaginatedTableProps<T> = {
  isLoading: boolean;
  columns: PaginatedTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  pagination: PaginatedTablePagination;
  pageSizeOptions: readonly number[];
  selection?: PaginatedTableSelection;
  /** Shown when not loading and `rows.length === 0`. */
  emptyMessage?: ReactNode;
  /** Appended to the `<table>` class (e.g. `table-fixed` for column width control). */
  tableClassName?: string;
};

const thBase =
  "px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] first:pl-4 last:pr-4";
const thSelect =
  "w-12 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] first:pl-4";
const tdBase =
  "max-w-0 min-w-0 px-3 py-2.5 text-center align-top text-[var(--text)] first:pl-4 last:pr-4 overflow-hidden";
const tdSelect =
  "w-12 px-3 py-2.5 text-center align-middle text-[var(--text)] first:pl-4 overflow-hidden";
const thNo = `${thBase} w-14 min-w-[3.25rem]`;
const tdNo = `${tdBase} w-14 min-w-[3.25rem] text-[var(--muted)] tabular-nums`;

const pageSizeSelectClass =
  "min-h-9 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-1 pl-2.5 pr-8 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25 disabled:cursor-not-allowed disabled:pointer-events-none disabled:border-[color-mix(in_srgb,var(--border)_55%,var(--surface))] disabled:bg-[color-mix(in_srgb,var(--surface)_92%,var(--surface-soft))] disabled:text-[var(--muted)] disabled:opacity-100";

const selectionCheckboxClass =
  "size-4 shrink-0 rounded border border-[var(--border)] text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:border-[color-mix(in_srgb,var(--border)_65%,var(--muted))] disabled:bg-[color-mix(in_srgb,var(--surface-soft)_75%,var(--surface))] disabled:text-[var(--muted)] disabled:opacity-100 disabled:grayscale";

const paginationNavButtonClass =
  "min-h-9 min-w-[4.5rem] flex-1 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition enabled:hover:bg-[var(--surface-soft)] enabled:hover:border-[color-mix(in_srgb,var(--accent)_18%,var(--border))] disabled:cursor-not-allowed disabled:pointer-events-none disabled:border-[color-mix(in_srgb,var(--border)_50%,transparent)] disabled:bg-[color-mix(in_srgb,var(--surface-soft)_55%,var(--surface))] disabled:text-[var(--muted)] disabled:opacity-100 sm:flex-none";

function PaginatedTable<T>({
  isLoading,
  columns,
  rows,
  getRowId,
  pagination,
  pageSizeOptions,
  selection,
  emptyMessage = "No rows to display.",
  tableClassName,
}: PaginatedTableProps<T>) {
  const { page, pageSize, total, onPageChange, onPageSizeChange } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const selectHeaderRef = useRef<HTMLInputElement>(null);
  const rowIdsOnPage = rows.map(getRowId);
  const headerScopeIds = selection?.headerToggleIds ?? rowIdsOnPage;
  const nHeaderScope = selection ? headerScopeIds.length : 0;

  useEffect(() => {
    if (!selection) return;
    const el = selectHeaderRef.current;
    if (!el) return;
    const nScope = headerScopeIds.length;
    const selScope = headerScopeIds.filter((id) =>
      selection.selectedIds.has(id),
    ).length;
    el.indeterminate = nScope > 0 && selScope > 0 && selScope < nScope;
    el.checked = nScope > 0 && selScope === nScope;
  }, [selection, headerScopeIds]);

  const togglePageSelection = () => {
    if (!selection) return;
    const ids = [...headerScopeIds];
    const allSelected =
      ids.length > 0 && ids.every((id) => selection.selectedIds.has(id));
    selection.onTogglePageRows(ids, !allSelected);
  };

  const colCount = columns.length + (selection ? 1 : 0) + 1;
  const showPageSizeControl = pageSizeOptions.length > 1;

  const root =
    "flex min-h-0 grow flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)]";

  return (
    <div className={root}>
      <div className="relative min-h-0 grow overflow-auto overscroll-contain">
        {isLoading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]"
            aria-busy="true"
            aria-live="polite"
          >
            <Loading size="md" />
          </div>
        ) : null}
        <table
          className={`w-full min-w-[34rem] border-collapse text-left text-sm sm:min-w-[36rem]${tableClassName ? ` ${tableClassName}` : ""}`}
        >
          <thead>
            <tr className="sticky rounded-t-lg top-0 z-10 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_88%,transparent)] backdrop-blur-sm">
              {selection ? (
                <th scope="col" className={thSelect}>
                  <input
                    ref={selectHeaderRef}
                    type="checkbox"
                    disabled={
                      selection.disabled || nHeaderScope === 0 || isLoading
                    }
                    onChange={togglePageSelection}
                    className={selectionCheckboxClass}
                  />
                </th>
              ) : null}
              <th scope="col" className={thNo}>
                No.
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={
                    col.headerClassName
                      ? `${thBase} ${col.headerClassName}`
                      : thBase
                  }
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-12 text-center text-sm text-[var(--muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {!isLoading &&
              rows.map((row, rowIndex) => {
                const id = getRowId(row);
                const rowNo = (safePage - 1) * pageSize + rowIndex + 1;
                const selectionLocked = Boolean(selection?.disabled);
                return (
                  <tr
                    key={id}
                    className={
                      selectionLocked
                        ? "border-b border-[var(--border)] transition last:border-b-0"
                        : "border-b border-[var(--border)] transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)]"
                    }
                  >
                    {selection ? (
                      <td className={tdSelect}>
                        <input
                          type="checkbox"
                          checked={selection.selectedIds.has(id)}
                          onChange={() => selection.onToggleRow(id)}
                          disabled={selection.disabled || isLoading}
                          className={selectionCheckboxClass}
                        />
                      </td>
                    ) : null}
                    <td className={tdNo}>{rowNo}</td>
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={
                          col.cellClassName
                            ? `${tdBase} ${col.cellClassName}`
                            : tdBase
                        }
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_65%,transparent)] px-3 py-3 sm:flex-row sm:items-center sm:px-4">
          {showPageSizeControl ? (
            <label className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="whitespace-nowrap">Showing</span>
              <span className="relative inline-flex">
                <select
                  className={pageSizeSelectClass}
                  value={pageSize}
                  disabled={isLoading}
                  aria-label="Rows per page"
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  aria-hidden
                >
                  <ChevronDownIcon className="size-4 shrink-0" />
                </span>
              </span>
              <span className="whitespace-nowrap">rows per page</span>
            </label>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">{pageSize}</span>{" "}
              rows per page
            </p>
          )}
          <p className="text-xs text-[var(--muted)] sm:ml-auto">
            Showing{" "}
            <span className="font-medium text-[var(--text)]">{start}</span>
            {"–"}
            <span className="font-medium text-[var(--text)]">
              {end}
            </span> of{" "}
            <span className="font-medium text-[var(--text)]">{total}</span>
          </p>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage <= 1 || isLoading}
              className={paginationNavButtonClass}
            >
              Previous
            </button>
            <span className="min-w-[5rem] text-center text-xs tabular-nums text-[var(--muted)]">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage >= totalPages || isLoading}
              className={paginationNavButtonClass}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PaginatedTable;
