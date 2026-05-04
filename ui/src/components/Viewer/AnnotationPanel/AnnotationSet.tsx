import CloudUpIcon from "../../../icons/CloudUpIcon";
import AnnotationItem from "./AnnotationItem";
import React, { useRef } from "react";
import type { AnnotationDetails } from "../../../types/Viewer";

function AnnotationSet({
  activeAnnotationSetId,
  annotations,
  handleSaveAnnotations,
  handleCancelAddingAnnotationSet,
  handleAnnotationDelete,
  handleUploadAnnotationSet,
}: {
  activeAnnotationSetId: string | null;
  annotations: AnnotationDetails[];
  handleSaveAnnotations: () => void;
  handleCancelAddingAnnotationSet: () => void;
  handleAnnotationDelete: (annotationUID: string) => void;
  handleUploadAnnotationSet: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleUploadAnnotationSetClick = () => {
    uploadInputRef.current?.click();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--surface-strong)] shadow-sm">
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {activeAnnotationSetId && (
          <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-strong)] to-[var(--surface-soft)] p-3 text-[12px]">
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Annotation set ID
              </p>
              <p
                className="mt-0.5 truncate font-mono text-xs font-medium text-[var(--text)]"
                title={activeAnnotationSetId}
              >
                {activeAnnotationSetId}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Total annotations
              </p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-[var(--text)]">
                {annotations.length}
              </p>
            </div>
          </div>
        )}
        {annotations.length === 0 ? (
          <div className="flex min-h-[8rem] flex-col items-center justify-center gap-1 px-4 py-8 text-center">
            <p className="text-sm font-medium text-[var(--muted)]">
              No annotations yet
            </p>
            <p className="max-w-[14rem] text-xs text-[var(--muted)]/85">
              Use the viewer toolbar to draw on the image.
            </p>
          </div>
        ) : (
          <div>
            {annotations.map((annotation) => (
              <React.Fragment key={annotation.annotationUID}>
                <AnnotationItem
                  annotation={annotation}
                  handleAnnotationDelete={handleAnnotationDelete}
                />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      <footer className="shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--surface-soft)] px-2 py-2.5">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-soft)]"
          onClick={handleUploadAnnotationSetClick}
        >
          <CloudUpIcon className="size-5 shrink-0" />
          Upload
        </button>
        <input
          type="file"
          accept=".json"
          multiple={false}
          ref={uploadInputRef}
          className="hidden"
          onChange={handleUploadAnnotationSet}
        />
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-soft)]"
          onClick={() => handleSaveAnnotations()}
        >
          Save annotation set
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          onClick={() => handleCancelAddingAnnotationSet()}
        >
          Cancel
        </button>
      </footer>
    </div>
  );
}

export default AnnotationSet;
