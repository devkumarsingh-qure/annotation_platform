import { useEffect, useReducer, useRef, useState } from "react";
import {
  segmentationHandler,
  type AiSegmentationPrompt,
  type ExportedSegmentation,
  type SegmentationToolName,
} from "@qureai/react-dicom-viewer";
import PenIcon from "../../../icons/PenIcon.tsx";
import XIcon from "../../../icons/XIcon.tsx";
import type { SegmentationMaskSummary } from "../../../types/Viewer.ts";
import MaskList from "./MaskList.tsx";
import SegmentationEditor from "./SegmentationEditor.tsx";

type SaveStatus = "saved" | "saving" | "unsaved";

type SegmentationPanelProps = {
  isOpen: boolean;
  masks: SegmentationMaskSummary[];
  isLoading: boolean;
  saveStatus: SaveStatus;
  onSave: (
    exported: ExportedSegmentation,
    sourceMask?: SegmentationMaskSummary,
  ) => Promise<SegmentationMaskSummary | undefined>;
  onDelete: (mask: SegmentationMaskSummary) => Promise<void>;
  onClose: () => void;
};

function SegmentationPanel({
  isOpen,
  masks,
  isLoading,
  saveStatus,
  onSave,
  onDelete,
  onClose,
}: SegmentationPanelProps) {
  const [, refresh] = useReducer((revision) => revision + 1, 0);
  const [dataRevision, markDataChanged] = useReducer(
    (revision) => revision + 1,
    0,
  );
  const [screen, setScreen] = useState<"list" | "editor">("list");
  const screenRef = useRef(screen);
  const [sourceMask, setSourceMask] = useState<SegmentationMaskSummary>();
  const [busyMaskId, setBusyMaskId] = useState<string>();
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [activeTool, setActiveTool] = useState<
    SegmentationToolName | AiSegmentationPrompt
  >("paint");
  const [brushSize, setBrushSize] = useState(12);

  const showScreen = (next: "list" | "editor") => {
    screenRef.current = next;
    setScreen(next);
  };

  useEffect(
    () =>
      segmentationHandler.subscribe((event) => {
        refresh();
        if (
          screenRef.current === "editor" &&
          event.type.toUpperCase().includes("SEGMENTATION_DATA_MODIFIED")
        ) {
          setIsDirty(true);
          markDataChanged();
        }
      }),
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      segmentationHandler.ai.deactivate();
    }
  }, [isOpen]);

  const viewportId = segmentationHandler.getActiveViewportId();
  const activeSegmentation =
    segmentationHandler.getActiveSegmentation(viewportId) ??
    segmentationHandler.getViewportSegmentations(viewportId)[0];
  const showingEditor = screen === "editor" && Boolean(activeSegmentation);

  const clearEditor = () => {
    segmentationHandler.clearViewportSegmentations(viewportId);
    setSourceMask(undefined);
    setError("");
    setIsDirty(false);
    showScreen("list");
  };

  const confirmCloseEditor = () => {
    if (
      isDirty &&
      !window.confirm("Discard the unsaved segmentation changes?")
    ) {
      return false;
    }
    clearEditor();
    return true;
  };

  const createMask = async () => {
    setBusyMaskId("new");
    setError("");
    try {
      segmentationHandler.clearViewportSegmentations(viewportId);
      await segmentationHandler.createSegmentation({
        viewportId,
        label: "Untitled segmentation",
        segments: [{ label: "Segment 1" }],
      });
      segmentationHandler.activateTool("paint", viewportId);
      segmentationHandler.setBrushSize(brushSize, viewportId);
      setSourceMask(undefined);
      setIsDirty(true);
      setActiveTool("paint");
      showScreen("editor");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusyMaskId(undefined);
    }
  };

  const openMask = async (mask: SegmentationMaskSummary) => {
    setBusyMaskId(mask.id);
    setError("");
    try {
      segmentationHandler.clearViewportSegmentations(viewportId);
      await segmentationHandler.importSegmentation(mask.url, {
        viewportId,
        segmentationId: `stored-mask-${mask.id}`,
        label: mask.label,
      });
      segmentationHandler.activateTool("paint", viewportId);
      segmentationHandler.setBrushSize(brushSize, viewportId);
      setSourceMask(mask);
      setIsDirty(false);
      setActiveTool("paint");
      showScreen("editor");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      segmentationHandler.clearViewportSegmentations(viewportId);
    } finally {
      setBusyMaskId(undefined);
    }
  };

  const deleteMask = async (mask: SegmentationMaskSummary) => {
    if (!window.confirm(`Delete the saved mask “${mask.label}”?`)) return;
    setBusyMaskId(mask.id);
    setError("");
    try {
      await onDelete(mask);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusyMaskId(undefined);
    }
  };

  const save = async () => {
    if (!activeSegmentation) return;
    setError("");
    try {
      const exported = segmentationHandler.exportSegmentation(
        activeSegmentation.segmentationId,
        viewportId,
      );
      const saved = await onSave(exported, sourceMask);
      if (saved) setSourceMask(saved);
      setIsDirty(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const selectTool = (tool: SegmentationToolName) => {
    try {
      segmentationHandler.ai.deactivate();
      segmentationHandler.activateTool(tool, viewportId);
      setActiveTool(tool);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  return (
    <aside
      aria-label="Segmentation workspace"
      inert={!isOpen}
      className={[
        "h-full min-h-0 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface-strong)] shadow-[-12px_0_30px_-24px_rgba(0,0,0,0.65)]",
        isOpen ? "flex w-full lg:w-[22rem]" : "hidden",
      ].join(" ")}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-soft)] to-[var(--surface-strong)] px-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <PenIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Segmentations
          </h2>
          <p className="truncate text-[10px] text-[var(--muted)]">
            {showingEditor ? "Edit active labelmap" : "Masks for this series"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close segmentation workspace"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
        >
          <XIcon className="size-4" />
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="border-b border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-500"
        >
          {error}
        </div>
      )}

      {showingEditor && activeSegmentation ? (
        <SegmentationEditor
          segmentation={activeSegmentation}
          viewportId={viewportId}
          activeTool={activeTool}
          brushSize={brushSize}
          dataRevision={dataRevision}
          isDirty={isDirty}
          saveStatus={saveStatus}
          onBack={confirmCloseEditor}
          onSave={() => void save()}
          onToolChange={selectTool}
          onAiPromptChange={setActiveTool}
          onBrushSizeChange={(size) => {
            setBrushSize(size);
            segmentationHandler.setBrushSize(size, viewportId);
          }}
          onMutate={() => setIsDirty(true)}
          onError={setError}
        />
      ) : (
        <MaskList
          masks={masks}
          isLoading={isLoading}
          busyMaskId={busyMaskId}
          onCreate={() => void createMask()}
          onOpen={(mask) => void openMask(mask)}
          onDelete={(mask) => void deleteMask(mask)}
        />
      )}
    </aside>
  );
}

export default SegmentationPanel;
