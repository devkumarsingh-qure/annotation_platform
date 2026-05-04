import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import Loading from "../Loading";

export type PaginatedTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
};

export type PaginatedTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export type PaginatedTableSelection<T> = {
  selectedIds: ReadonlySet<string>;
  onToggleRow: (id: string) => void;
  onTogglePageRows: (rowIds: string[], select: boolean) => void;
  disabled?: boolean;
};

export type PaginatedTableProps<T> = {
  isLoading: boolean;
  columns: PaginatedTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  pagination: PaginatedTablePagination;
  pageSizeOptions: readonly number[];
  selection?: PaginatedTableSelection<T>;
};

const thBase =
  "px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] first:pl-4 last:pr-4";
const thSelect =
  "w-12 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)] first:pl-4";
const tdBase =
  "max-w-0 min-w-0 px-3 py-2.5 text-center align-top text-[var(--text)] first:pl-4 last:pr-4 overflow-hidden";
const tdSelect =
  "w-12 px-3 py-2.5 text-center align-middle text-[var(--text)] first:pl-4 overflow-hidden";

const pageSizeSelectClass =
  "min-h-9 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-1 pl-2.5 pr-8 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25 disabled:cursor-not-allowed disabled:opacity-60";

function PaginatedTable<T>({
  isLoading,
  columns,
  rows,
  getRowId,
  pagination,
  pageSizeOptions,
  selection,
}: PaginatedTableProps<T>) {
  const { page, pageSize, total, onPageChange, onPageSizeChange } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const selectHeaderRef = useRef<HTMLInputElement>(null);
  const rowIdsOnPage = rows.map(getRowId);
  const selectedInView = selection
    ? rowIdsOnPage.filter((id) => selection.selectedIds.has(id)).length
    : 0;
  const nVisible = rowIdsOnPage.length;

  useEffect(() => {
    if (!selection) return;
    const el = selectHeaderRef.current;
    if (!el) return;
    el.indeterminate =
      nVisible > 0 && selectedInView > 0 && selectedInView < nVisible;
    el.checked = nVisible > 0 && selectedInView === nVisible;
  }, [selection, nVisible, selectedInView]);

  const togglePageSelection = () => {
    if (!selection) return;
    const allSelected =
      nVisible > 0 && rowIdsOnPage.every((id) => selection.selectedIds.has(id));
    selection.onTogglePageRows(rowIdsOnPage, !allSelected);
  };

  const colCount = columns.length + (selection ? 1 : 0);
  const showPageSizeControl = pageSizeOptions.length > 1;

  const root =
    "flex min-h-0 grow flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)]";

  return (
    <div className={root}>
      <div className="relative min-h-0 grow overflow-auto">
        {isLoading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]"
            aria-busy="true"
            aria-live="polite"
          >
            <Loading size="md" />
          </div>
        ) : null}
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_88%,transparent)]">
              {selection ? (
                <th scope="col" className={thSelect}>
                  <input
                    ref={selectHeaderRef}
                    type="checkbox"
                    disabled={selection.disabled || nVisible === 0 || isLoading}
                    onChange={togglePageSelection}
                    className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th key={col.id} scope="col" className={thBase}>
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
                  No rows to display.
                </td>
              </tr>
            ) : null}
            {!isLoading &&
              rows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--border)] transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)]"
                  >
                    {selection ? (
                      <td className={tdSelect}>
                        <input
                          type="checkbox"
                          checked={selection.selectedIds.has(id)}
                          onChange={() => selection.onToggleRow(id)}
                          disabled={selection.disabled}
                          className="size-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td key={col.id} className={tdBase}>
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
        <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_65%,transparent)] px-4 py-3 sm:flex-row sm:items-center">
          {showPageSizeControl ? (
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
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
          <p className="ml-auto text-xs text-[var(--muted)]">
            Showing{" "}
            <span className="font-medium text-[var(--text)]">{start}</span>
            {"–"}
            <span className="font-medium text-[var(--text)]">
              {end}
            </span> of{" "}
            <span className="font-medium text-[var(--text)]">{total}</span>
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="min-h-9 min-w-[4.5rem] rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-[5rem] text-center text-xs tabular-nums text-[var(--muted)]">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className="min-h-9 min-w-[4.5rem] rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
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
