import type { Annotation } from "../../../types/Viewer";
import AnnotationItem from "./AnnotationItem";
import React from "react";

function AnnotationSet({
    annotations,
    handleSaveAnnotations,
    handleCancelAddingAnnotationSet,
    handleAnnotationDelete,
}: {
    annotations: Annotation[];
    handleSaveAnnotations: () => void;
    handleCancelAddingAnnotationSet: () => void;
    handleAnnotationDelete: (annotationUID: string) => void;

}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm">
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain px-1 py-2">
                {annotations.length === 0 ? (
                    <div className="flex min-h-[8rem] flex-col items-center justify-center gap-1 px-4 py-8 text-center">
                        <p className="text-sm font-medium text-[var(--muted)]">No annotations yet</p>
                        <p className="max-w-[14rem] text-xs text-[var(--muted)]/85">
                            Use the viewer toolbar to draw on the image.
                        </p>
                    </div>
                ) : (
                    annotations.map((annotation) => (
                        <React.Fragment key={annotation.annotationUID}>
                            <AnnotationItem
                                annotation={annotation}
                                handleAnnotationDelete={handleAnnotationDelete}
                            />
                        </React.Fragment>
                    ))
                )}
            </div>
            <footer className="shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--surface-soft)] px-2 py-2.5">
                <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-soft)]"
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
    )
}

export default AnnotationSet;