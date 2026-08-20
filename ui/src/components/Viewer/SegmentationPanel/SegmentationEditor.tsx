import {
  segmentationHandler,
  type AiSegmentationPrompt,
  type SegmentationState,
  type SegmentationToolName,
} from "@qureai/react-dicom-viewer";
import EyeIcon from "../../../icons/EyeIcon.tsx";
import EyeSlashIcon from "../../../icons/EyeSlashIcon.tsx";
import MetricsPanel from "./MetricsPanel.tsx";
import SegmentList from "./SegmentList.tsx";
import ToolPalette from "./ToolPalette.tsx";

type SaveStatus = "saved" | "saving" | "unsaved";

type SegmentationEditorProps = {
  segmentation: SegmentationState;
  viewportId: string;
  activeTool: SegmentationToolName | AiSegmentationPrompt;
  brushSize: number;
  dataRevision: number;
  isDirty: boolean;
  saveStatus: SaveStatus;
  onBack: () => void;
  onSave: () => void;
  onToolChange: (tool: SegmentationToolName) => void;
  onAiPromptChange: (prompt: AiSegmentationPrompt) => void;
  onBrushSizeChange: (size: number) => void;
  onMutate: () => void;
  onError: (message: string) => void;
};

function SegmentationEditor({
  segmentation,
  viewportId,
  activeTool,
  brushSize,
  dataRevision,
  isDirty,
  saveStatus,
  onBack,
  onSave,
  onToolChange,
  onAiPromptChange,
  onBrushSizeChange,
  onMutate,
  onError,
}: SegmentationEditorProps) {
  const segmentationVisible = segmentationHandler.getSegmentationVisibility(
    segmentation.segmentationId,
    viewportId,
  );
  const opacity = segmentationHandler.getOpacity(
    segmentation.segmentationId,
    viewportId,
  );
  const outline = segmentationHandler.getOutline(
    segmentation.segmentationId,
    viewportId,
  );
  const slice = segmentationHandler.getViewportSliceInfo(viewportId);
  const activeSegmentIndex =
    segmentationHandler.getActiveSegmentIndex(segmentation.segmentationId);
  const displayedStatus =
    saveStatus === "saving" ? "Saving…" : isDirty ? "Unsaved" : "Saved";

  const renameSegmentation = (value: string) => {
    const nextLabel = value.trim() || "Untitled segmentation";
    if (nextLabel === segmentation.label) return;
    segmentationHandler.renameSegmentation(
      segmentation.segmentationId,
      nextLabel,
    );
    onMutate();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
        >
          ← Masks
        </button>
        <span
          className={[
            "ml-auto rounded-full px-2 py-1 text-[10px] font-semibold",
            displayedStatus === "Saved"
              ? "bg-emerald-500/12 text-emerald-500"
              : displayedStatus === "Saving…"
                ? "bg-amber-500/12 text-amber-500"
                : "bg-rose-500/12 text-rose-500",
          ].join(" ")}
        >
          {displayedStatus}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-[var(--border)] p-3">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Segmentation name
          </label>
          <input
            key={segmentation.label}
            defaultValue={segmentation.label}
            onBlur={(event) => renameSegmentation(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="mt-1.5 h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>
              Slice {slice.index + 1} / {Math.max(slice.total, 1)}
            </span>
            <button
              type="button"
              onClick={() =>
                segmentationHandler.setSegmentationVisibility(
                  segmentation.segmentationId,
                  !segmentationVisible,
                  viewportId,
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition hover:bg-[var(--surface-soft)]"
            >
              {segmentationVisible ? (
                <EyeIcon className="size-3.5" />
              ) : (
                <EyeSlashIcon className="size-3.5" />
              )}
              {segmentationVisible ? "Visible" : "Hidden"}
            </button>
          </div>
        </section>

        <ToolPalette
          viewportId={viewportId}
          activeTool={activeTool}
          brushSize={brushSize}
          onToolChange={onToolChange}
          onAiPromptChange={onAiPromptChange}
          onBrushSizeChange={onBrushSizeChange}
          onError={onError}
        />

        <SegmentList
          segmentation={segmentation}
          viewportId={viewportId}
          onMutate={onMutate}
        />

        <MetricsPanel
          segmentationId={segmentation.segmentationId}
          segmentIndex={activeSegmentIndex}
          dataRevision={dataRevision}
        />

        <section className="p-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Display
          </h3>
          <label className="mt-2 block text-[11px] font-medium text-[var(--muted)]">
            <span className="flex justify-between">
              <span>Overlay opacity</span>
              <span>{Math.round(opacity * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(opacity * 100)}
              onChange={(event) =>
                segmentationHandler.setOpacity(
                  segmentation.segmentationId,
                  Number(event.currentTarget.value) / 100,
                  viewportId,
                )
              }
              className="mt-1 w-full accent-[var(--accent)]"
            />
          </label>
          <label className="mt-2 flex items-center justify-between text-xs text-[var(--text)]">
            Show segment outlines
            <input
              type="checkbox"
              checked={outline}
              onChange={(event) =>
                segmentationHandler.setOutline(
                  segmentation.segmentationId,
                  event.currentTarget.checked,
                  viewportId,
                )
              }
              className="size-4 accent-[var(--accent)]"
            />
          </label>
        </section>
      </div>

      <footer className="border-t border-[var(--border)] bg-[var(--surface-strong)] p-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving"}
          className="min-h-10 w-full rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveStatus === "saving"
            ? "Saving DICOM SEG…"
            : isDirty
              ? "Save segmentation"
              : "Save again"}
        </button>
      </footer>
    </div>
  );
}

export default SegmentationEditor;
