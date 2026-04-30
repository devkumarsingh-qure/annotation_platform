import CloudUpIcon from "../../../icons/CloudUpIcon";
import type { Annotation } from "../../../types/Viewer";
import AnnotationItem from "./AnnotationItem";
import React, { useRef } from "react";

function AnnotationSet({
    activeAnnotationSetId,
    annotations,
    handleSaveAnnotations,
    handleCancelAddingAnnotationSet,
    handleAnnotationDelete,
    handleUploadAnnotationSet,
}: {
    activeAnnotationSetId: string | null;
    annotations: Annotation[];
    handleSaveAnnotations: () => void;
    handleCancelAddingAnnotationSet: () => void;
    handleAnnotationDelete: (annotationUID: string) => void;
    handleUploadAnnotationSet: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const handleUploadAnnotationSetClick = () => {
        uploadInputRef.current?.click();
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--surface-strong)] shadow-sm">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-2">
                {
                    activeAnnotationSetId && (
                        <div className="mx-2 mb-2 pr-5 rounded-lg flex items-center justify-between border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                                Annotation set ID
                            </p>
                            <p
                                className="mt-1 truncate font-mono text-xs font-medium text-[var(--text)]"
                                title={activeAnnotationSetId}
                            >
                                {activeAnnotationSetId}
                            </p>
                        </div>
                    )
                }
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
                <div className="sticky top-2 flex items-center justify-between rounded-lg border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent-soft)]/70 to-[var(--surface-strong)] px-3 py-2 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text)]/85">
                        Annotations
                    </p>
                    <p className="flex items-center justify-center rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/15 px-2 py-0.5 text-sm font-semibold text-[var(--accent)]">
                        {annotations.length}
                    </p>
                </div>
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
    )
}

export default AnnotationSet;