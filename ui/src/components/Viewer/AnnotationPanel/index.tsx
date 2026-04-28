import { viewerProvider } from "@qureai/react-dicom-viewer";
import type { Annotation, AnnotationSet } from "../../../types/Viewer";
import React, { useEffect, useState } from "react";
import AnnotationItem from "./AnnotationItem";
import { API_PATHS } from "../../../utils/urls";
import apiClient from "../../../utils/apiClient";
import validateAnnotationsJSON from "./utils/validateAnnotationsJSON";
import AnnotationSets from "./AnnotationSets";

function AnnotationPanel({
    patient_id,
    study_id,
    series_id,
}: {
    patient_id: string;
    study_id: string;
    series_id: string;
}) {
    const [isAnnotationSetsLoading, setIsAnnotationSetsLoading] = useState(true);
    const [annotationSets, setAnnotationSets] = useState<AnnotationSet[]>([]);
    const [annotations, setAnnotations] = useState<{
        annotationSetId?: string;
        annotations: Annotation[];
    }>();

    useEffect(() => {
        fetchAnnotationSets();
    }, [patient_id, study_id, series_id]);

    const fetchAnnotationSets = async () => {
        apiClient.get(API_PATHS.ANNOTATIONS_FOR_SERIES(patient_id, study_id, series_id)).then((response) => {
            setAnnotationSets(response.data);
        }).finally(() => {
            setIsAnnotationSetsLoading(false);
        });
    }

    const startAddingAnnotation = () => {
        viewerProvider.annotationHandler.startAddingAnnotation({
            callback: () => {
                const annotations =
                    viewerProvider.annotationHandler.getAnnotationsForActiveViewport();
                setAnnotations((prev) => ({
                    annotationSetId: prev?.annotationSetId,
                    annotations: annotations ?? [],
                }));
            },
            callbackTimeoutDelay: 1000,
        });
    }

    const handleStartAddingAnnotationSet = () => {
        viewerProvider.annotationHandler.removeAllAnnotations();
        startAddingAnnotation();
        setAnnotations({
            annotations: []
        })
    }

    const handleCancelAddingAnnotationSet = () => {
        setAnnotations(undefined);
        viewerProvider.annotationHandler.removeAllAnnotations();
        viewerProvider.annotationHandler.stopAddingAnnotation();
    };

    const handleAnnotationSetClick = async (annotationSetId: string) => {
        const response = await apiClient.get(API_PATHS.ANNOTATION_SET(patient_id, study_id, series_id, annotationSetId));
        const { url } = response.data;
        const annotationSet = await fetch(url);
        const annotations = await annotationSet.json();
        const isValid = validateAnnotationsJSON(annotations);
        if (!isValid) {
            return;
        }
        const addedAnnotations = viewerProvider.annotationHandler.addAnnotations(annotations)
        setAnnotations({
            annotationSetId: annotationSetId,
            annotations: addedAnnotations ?? [],
        });
        startAddingAnnotation();
    }

    const handleAnnotationDelete = (annotationUID: string) => {
        viewerProvider.annotationHandler.deleteAnnotationForActiveViewport({
            annotationUID,
        });
        setAnnotations((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                annotations: prev.annotations.filter(
                    (annotation) => annotation.annotationUID !== annotationUID,
                ),
            };
        });
    };

    const handleSaveAnnotations = async () => {
        if (!annotations) {
            return;
        }
        const data = {
            annotationSetId: annotations.annotationSetId,
            annotations: annotations.annotations.map((annotation) => ({
                toolName: annotation.toolName,
                sliceIndex: annotation.sliceIndex,
                points: annotation.points,
            })),
        }
        await apiClient.post(API_PATHS.ANNOTATIONS_FOR_SERIES(patient_id, study_id, series_id), data);
        await fetchAnnotationSets();
        viewerProvider.annotationHandler.removeAllAnnotations();
        viewerProvider.annotationHandler.stopAddingAnnotation();
        setAnnotations(undefined);
    };

    return (
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface-soft)] backdrop-blur-[12px]">
            <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4">
                <h1 className="font-semibold tracking-tight text-[var(--text)]">
                    Annotations
                </h1>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
                {annotations ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm">
                        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain px-1 py-2">
                            {annotations.annotations.length === 0 ? (
                                <div className="flex min-h-[8rem] flex-col items-center justify-center gap-1 px-4 py-8 text-center">
                                    <p className="text-sm font-medium text-[var(--muted)]">No annotations yet</p>
                                    <p className="max-w-[14rem] text-xs text-[var(--muted)]/85">
                                        Use the viewer toolbar to draw on the image.
                                    </p>
                                </div>
                            ) : (
                                annotations.annotations.map((annotation) => (
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
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)]">
                        <AnnotationSets
                            annotationSets={annotationSets}
                            handleStartAddingAnnotationSet={handleStartAddingAnnotationSet}
                            handleAnnotationSetClick={handleAnnotationSetClick}
                            isAnnotationSetsLoading={isAnnotationSetsLoading}
                        />
                    </div>
                )}
            </div>
        </aside>
    );
}

export default AnnotationPanel;
