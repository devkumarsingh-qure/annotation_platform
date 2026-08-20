import { useEffect, useState } from "react";
import {
  segmentationHandler,
  type AiSegmentationPrompt,
} from "@qureai/react-dicom-viewer";

const PROMPTS: Array<{
  id: AiSegmentationPrompt;
  label: string;
  glyph: string;
  hint: string;
}> = [
  { id: "include", label: "Include", glyph: "+", hint: "Keep this area" },
  { id: "exclude", label: "Exclude", glyph: "−", hint: "Remove this area" },
  { id: "box", label: "Box", glyph: "□", hint: "Bound the object" },
];

function AiSegmentationTools({
  viewportId,
  onPromptChange,
  onError,
}: {
  viewportId: string;
  onPromptChange: (prompt: AiSegmentationPrompt) => void;
  onError: (message: string) => void;
}) {
  const [aiState, setAiState] = useState(() =>
    segmentationHandler.ai.getState(),
  );

  useEffect(() => segmentationHandler.ai.subscribe(setAiState), []);

  const run = async (action: () => void | Promise<void>) => {
    try {
      onError("");
      await action();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const selectPrompt = (prompt: AiSegmentationPrompt) => {
    void run(() => {
      segmentationHandler.ai.activatePrompt(prompt, viewportId);
      onPromptChange(prompt);
    });
  };

  const start = () => {
    void run(async () => {
      await segmentationHandler.ai.initialize(viewportId);
      segmentationHandler.ai.activatePrompt("include", viewportId);
      onPromptChange("include");
    });
  };

  return (
    <details className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/[0.06]">
      <summary className="cursor-pointer px-2.5 py-2 text-[11px] font-semibold text-sky-500">
        AI assist · SAM
      </summary>
      <div className="space-y-3 border-t border-sky-500/20 p-2.5">
        {aiState.phase === "idle" || aiState.phase === "error" ? (
          <>
            <p className="text-[10px] leading-relaxed text-[var(--muted)]">
              Segment the active label with include points, exclude points, or a
              bounding box. The first run downloads about 197 MB and caches it
              in this browser.
            </p>
            {aiState.phase === "error" && (
              <p className="rounded-md bg-rose-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-rose-500">
                {aiState.message}
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="h-9 w-full rounded-md bg-sky-500 px-3 text-xs font-semibold text-white transition hover:bg-sky-400"
            >
              {aiState.phase === "error" ? "Retry AI model" : "Load AI model"}
            </button>
          </>
        ) : aiState.phase === "loading" ? (
          <div
            role="status"
            className="rounded-md border border-sky-500/20 bg-[var(--surface-soft)] p-2.5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <span className="size-3 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-500" />
              Loading SAM
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
              {aiState.message}
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Prompt
                </p>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-500">
                  Ready
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PROMPTS.map((prompt) => {
                  const selected = aiState.activePrompt === prompt.id;
                  return (
                    <button
                      key={prompt.id}
                      type="button"
                      aria-pressed={selected}
                      title={prompt.hint}
                      onClick={() => selectPrompt(prompt.id)}
                      className={[
                        "flex min-h-12 flex-col items-center justify-center rounded-md border text-[10px] font-semibold transition",
                        selected
                          ? "border-sky-500 bg-sky-500/15 text-sky-500"
                          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)]",
                      ].join(" ")}
                    >
                      <span className="text-base leading-none">
                        {prompt.glyph}
                      </span>
                      <span className="mt-1">{prompt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="rounded-md bg-[var(--surface-soft)] px-2 py-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
              {aiState.message} AI output is written to the active segment.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  void run(() =>
                    segmentationHandler.ai.acceptPreview(viewportId),
                  )
                }
                className="h-8 rounded-md bg-emerald-500 px-2 text-[10px] font-semibold text-white hover:bg-emerald-400"
              >
                Apply preview
              </button>
              <button
                type="button"
                onClick={() =>
                  void run(() =>
                    segmentationHandler.ai.rejectPreview(viewportId),
                  )
                }
                className="h-8 rounded-md border border-[var(--border)] px-2 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              >
                Discard preview
              </button>
              <button
                type="button"
                onClick={() =>
                  void run(() =>
                    segmentationHandler.ai.propagate(-1, viewportId),
                  )
                }
                className="h-8 rounded-md border border-[var(--border)] px-2 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              >
                ← Previous slice
              </button>
              <button
                type="button"
                onClick={() =>
                  void run(() =>
                    segmentationHandler.ai.propagate(1, viewportId),
                  )
                }
                className="h-8 rounded-md border border-[var(--border)] px-2 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
              >
                Next slice →
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                void run(() => segmentationHandler.ai.clearPrompts(viewportId))
              }
              className="h-8 w-full rounded-md border border-[var(--border)] text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            >
              Clear prompts
            </button>
          </>
        )}
      </div>
    </details>
  );
}

export default AiSegmentationTools;
