import {
  segmentationHandler,
  type SegmentationState,
} from "@qureai/react-dicom-viewer";
import PlusIcon from "../../../icons/PlusIcon.tsx";
import TrashIcon from "../../../icons/TrashIcon.tsx";

type SegmentListProps = {
  segmentation: SegmentationState;
  viewportId: string;
  onMutate: () => void;
};

function colorToHex(color: [number, number, number, number]) {
  return `#${color
    .slice(0, 3)
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToColor(value: string): [number, number, number, number] {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
    255,
  ];
}

function SegmentList({
  segmentation,
  viewportId,
  onMutate,
}: SegmentListProps) {
  const activeSegmentIndex =
    segmentationHandler.getActiveSegmentIndex(segmentation.segmentationId);
  const segmentOrder =
    segmentation.segmentOrder ?? Object.keys(segmentation.segments).map(Number);
  const segments = segmentOrder.flatMap((segmentIndex) => {
    const segment = segmentation.segments[segmentIndex];
    return segment ? [segment] : [];
  });

  return (
    <section className="border-b border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Segments
        </h3>
        <button
          type="button"
          onClick={() => {
            segmentationHandler.addSegment(
              segmentation.segmentationId,
              {},
              viewportId,
            );
            onMutate();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]"
        >
          <PlusIcon className="size-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {segments.map((segment) => {
          const selected = activeSegmentIndex === segment.segmentIndex;
          const visible = segmentationHandler.getSegmentVisibility(
            segmentation.segmentationId,
            segment.segmentIndex,
            viewportId,
          );
          const locked = segmentationHandler.isSegmentLocked(
            segmentation.segmentationId,
            segment.segmentIndex,
          );
          const color = segmentationHandler.getSegmentColor(
            segmentation.segmentationId,
            segment.segmentIndex,
            viewportId,
          );

          return (
            <div
              key={segment.segmentIndex}
              className={[
                "rounded-lg border p-2",
                selected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]/65"
                  : "border-[var(--border)] bg-[var(--surface-soft)]/45",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    segmentationHandler.setActiveSegment(
                      segmentation.segmentationId,
                      segment.segmentIndex,
                      viewportId,
                    )
                  }
                  aria-label={`Select ${segment.label}`}
                  className={[
                    "size-3.5 shrink-0 rounded-full border-2",
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--muted)]",
                  ].join(" ")}
                />
                <input
                  key={`${segment.segmentIndex}-${segment.label}`}
                  defaultValue={segment.label}
                  onBlur={(event) => {
                    const nextLabel =
                      event.currentTarget.value.trim() ||
                      `Segment ${segment.segmentIndex}`;
                    if (nextLabel === segment.label) return;
                    segmentationHandler.renameSegment(
                      segmentation.segmentationId,
                      segment.segmentIndex,
                      nextLabel,
                    );
                    onMutate();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  aria-label={`Segment ${segment.segmentIndex} name`}
                  className="h-7 min-w-0 flex-1 bg-transparent text-xs font-semibold text-[var(--text)] outline-none"
                />
                <input
                  type="color"
                  value={colorToHex(color)}
                  onChange={(event) => {
                    segmentationHandler.setSegmentColor(
                      segmentation.segmentationId,
                      segment.segmentIndex,
                      hexToColor(event.currentTarget.value),
                      viewportId,
                    );
                    onMutate();
                  }}
                  aria-label={`Color for ${segment.label}`}
                  className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </div>
              <div className="mt-1.5 flex items-center gap-1 pl-5">
                <button
                  type="button"
                  onClick={() =>
                    segmentationHandler.setSegmentVisibility(
                      segmentation.segmentationId,
                      segment.segmentIndex,
                      !visible,
                      viewportId,
                    )
                  }
                  className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                >
                  {visible ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    segmentationHandler.setSegmentLocked(
                      segmentation.segmentationId,
                      segment.segmentIndex,
                      !locked,
                    );
                    onMutate();
                  }}
                  className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                >
                  {locked ? "Unlock" : "Lock"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Clear all voxels from “${segment.label}”?`,
                      )
                    ) {
                      segmentationHandler.clearSegment(
                        segmentation.segmentationId,
                        segment.segmentIndex,
                      );
                      onMutate();
                    }
                  }}
                  className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                >
                  Clear
                </button>
                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(`Delete segment “${segment.label}”?`)
                      ) {
                        segmentationHandler.removeSegment(
                          segmentation.segmentationId,
                          segment.segmentIndex,
                        );
                        onMutate();
                      }
                    }}
                    aria-label={`Delete ${segment.label}`}
                    className="ml-auto rounded-md p-1 text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface-soft))]"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default SegmentList;
