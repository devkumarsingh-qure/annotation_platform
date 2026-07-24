import PlusIcon from "../../../icons/PlusIcon.tsx";
import TrashIcon from "../../../icons/TrashIcon.tsx";
import type { SegmentationMaskSummary } from "../../../types/Viewer.ts";
import Loading from "../../Loading/index.tsx";

type MaskListProps = {
  masks: SegmentationMaskSummary[];
  isLoading: boolean;
  busyMaskId?: string;
  onCreate: () => void;
  onOpen: (mask: SegmentationMaskSummary) => void;
  onDelete: (mask: SegmentationMaskSummary) => void;
};

function formatMaskDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function MaskList({
  masks,
  isLoading,
  busyMaskId,
  onCreate,
  onOpen,
  onDelete,
}: MaskListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] p-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={Boolean(busyMaskId)}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
          Create new segmentation
        </button>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          Create a labelmap or reopen a DICOM SEG saved for this series.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Saved masks
          </h3>
          {!isLoading && (
            <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
              {masks.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-36 items-center justify-center">
            <Loading size="lg" />
          </div>
        ) : masks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--text)]">
              No saved segmentations
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Your first saved DICOM SEG will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {masks.map((mask) => {
              const isBusy = busyMaskId === mask.id;
              return (
                <li
                  key={mask.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/55 p-3 transition hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                      {mask.label}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      {formatMaskDate(mask.updated_at)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(mask)}
                      disabled={Boolean(busyMaskId)}
                      className="min-h-8 flex-1 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-strong)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? "Opening…" : "Open"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(mask)}
                      disabled={Boolean(busyMaskId)}
                      aria-label={`Delete ${mask.label}`}
                      title="Delete saved segmentation"
                      className="flex size-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--danger)_38%,var(--border))] text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface-soft))] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MaskList;
