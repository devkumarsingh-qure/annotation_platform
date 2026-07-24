import { useState } from "react";
import {
  segmentationHandler,
  type SegmentationToolName,
} from "@qureai/react-dicom-viewer";

type ToolPaletteProps = {
  viewportId: string;
  activeTool: SegmentationToolName;
  brushSize: number;
  onToolChange: (tool: SegmentationToolName) => void;
  onBrushSizeChange: (size: number) => void;
};

type ToolDefinition = {
  id: SegmentationToolName;
  label: string;
  glyph: string;
};

const CORE_TOOLS: ToolDefinition[] = [
  { id: "paint", label: "Paint", glyph: "●" },
  { id: "erase", label: "Erase", glyph: "○" },
  { id: "freehand", label: "Contour", glyph: "⌁" },
  { id: "fill", label: "Fill", glyph: "▧" },
  { id: "select", label: "Select", glyph: "↖" },
  { id: "threshold", label: "Threshold", glyph: "◐" },
];

const ADVANCED_TOOL_GROUPS: Array<{
  label: string;
  tools: ToolDefinition[];
}> = [
  {
    label: "3D brush",
    tools: [
      { id: "paint3d", label: "Paint 3D", glyph: "⬤" },
      { id: "erase3d", label: "Erase 3D", glyph: "◯" },
      { id: "threshold3d", label: "Threshold 3D", glyph: "◒" },
      { id: "thresholdIsland", label: "Island", glyph: "◎" },
    ],
  },
  {
    label: "Scissors",
    tools: [
      { id: "rectangle", label: "Box", glyph: "□" },
      { id: "rectangleErase", label: "Erase box", glyph: "▣" },
      { id: "circle", label: "Circle", glyph: "◯" },
      { id: "circleErase", label: "Erase circle", glyph: "⊘" },
      { id: "sphere", label: "Sphere", glyph: "◉" },
      { id: "sphereErase", label: "Erase sphere", glyph: "⊖" },
    ],
  },
  {
    label: "Smart",
    tools: [{ id: "click", label: "Click segment", glyph: "✦" }],
  },
];

const BRUSH_TOOLS = new Set<SegmentationToolName>([
  "brush",
  "eraser",
  "paint",
  "erase",
  "paint3d",
  "erase3d",
  "threshold",
  "threshold3d",
  "thresholdIsland",
]);

const THRESHOLD_TOOLS = new Set<SegmentationToolName>([
  "threshold",
  "threshold3d",
  "thresholdIsland",
]);

function ToolButton({
  tool,
  selected,
  onSelect,
}: {
  tool: ToolDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "flex min-h-12 flex-col items-center justify-center rounded-lg border px-1 text-[10px] font-semibold transition",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          : "border-[var(--border)] bg-[var(--surface-soft)]/55 text-[var(--muted)] hover:text-[var(--text)]",
      ].join(" ")}
    >
      <span className="text-base leading-none">{tool.glyph}</span>
      <span className="mt-1 truncate">{tool.label}</span>
    </button>
  );
}

function ToolPalette({
  viewportId,
  activeTool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
}: ToolPaletteProps) {
  const [brushPreview, setBrushPreview] = useState(
    () => segmentationHandler.getBrushPreview(viewportId) ?? true,
  );
  const [thresholdRange, setThresholdRange] = useState<[number, number]>(
    () => segmentationHandler.getThresholdRange(viewportId) ?? [-100, 300],
  );
  const [selectMode, setSelectMode] = useState<"border" | "inside">("border");

  const updateThreshold = (range: [number, number]) => {
    setThresholdRange(range);
    segmentationHandler.setThresholdRange(range, viewportId);
  };

  const selectTool = (tool: SegmentationToolName) => {
    onToolChange(tool);
    if (THRESHOLD_TOOLS.has(tool)) {
      segmentationHandler.setThresholdRange(thresholdRange, viewportId);
    }
  };

  return (
    <section className="border-b border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Edit tools
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => segmentationHandler.undo(viewportId)}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-soft)]"
            title="Undo"
            aria-label="Undo segmentation edit"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => segmentationHandler.redo(viewportId)}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-soft)]"
            title="Redo"
            aria-label="Redo segmentation edit"
          >
            ↷
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {CORE_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            selected={activeTool === tool.id}
            onSelect={() => selectTool(tool.id)}
          />
        ))}
      </div>

      <details className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/35">
        <summary className="cursor-pointer px-2.5 py-2 text-[11px] font-semibold text-[var(--muted)]">
          More segmentation tools
        </summary>
        <div className="space-y-3 border-t border-[var(--border)] p-2.5">
          {ADVANCED_TOOL_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {group.tools.map((tool) => (
                  <ToolButton
                    key={tool.id}
                    tool={tool}
                    selected={activeTool === tool.id}
                    onSelect={() => selectTool(tool.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {BRUSH_TOOLS.has(activeTool) && (
        <div className="mt-3 space-y-2">
          <label className="block text-[11px] font-medium text-[var(--muted)]">
            <span className="flex justify-between">
              <span>Brush size</span>
              <span>{brushSize}px</span>
            </span>
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              onChange={(event) =>
                onBrushSizeChange(Number(event.currentTarget.value))
              }
              className="mt-1 w-full accent-[var(--accent)]"
            />
          </label>
          <label className="flex items-center justify-between text-[11px] text-[var(--text)]">
            Brush preview
            <input
              type="checkbox"
              checked={brushPreview}
              onChange={(event) => {
                const enabled = event.currentTarget.checked;
                setBrushPreview(enabled);
                segmentationHandler.setBrushPreview(enabled, viewportId);
              }}
              className="size-4 accent-[var(--accent)]"
            />
          </label>
        </div>
      )}

      {THRESHOLD_TOOLS.has(activeTool) && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-[var(--muted)]">
            Intensity threshold
          </p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="text-[10px] text-[var(--muted)]">
              Minimum
              <input
                key={`minimum-${thresholdRange[0]}`}
                type="number"
                defaultValue={thresholdRange[0]}
                onBlur={(event) => {
                  const value = Number(event.currentTarget.value);
                  if (Number.isFinite(value)) {
                    updateThreshold([value, thresholdRange[1]]);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className="mt-1 h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="text-[10px] text-[var(--muted)]">
              Maximum
              <input
                key={`maximum-${thresholdRange[1]}`}
                type="number"
                defaultValue={thresholdRange[1]}
                onBlur={(event) => {
                  const value = Number(event.currentTarget.value);
                  if (Number.isFinite(value)) {
                    updateThreshold([thresholdRange[0], value]);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className="mt-1 h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </div>
      )}

      {activeTool === "select" && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-[var(--muted)]">
            Selection mode
          </p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {(["border", "inside"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={selectMode === mode}
                onClick={() => {
                  setSelectMode(mode);
                  segmentationHandler.setSegmentSelectMode(mode, viewportId);
                }}
                className={[
                  "h-8 rounded-md border text-[11px] font-semibold capitalize",
                  selectMode === mode
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "border-[var(--border)] text-[var(--muted)]",
                ].join(" ")}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === "click" && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["expand", "shrink", "cancel"] as const).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() =>
                segmentationHandler.adjustClickSegment(action, viewportId)
              }
              className="h-8 rounded-md border border-[var(--border)] text-[10px] font-semibold capitalize text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default ToolPalette;
