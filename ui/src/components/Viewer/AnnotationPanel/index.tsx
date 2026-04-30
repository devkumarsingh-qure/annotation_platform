import { useEffect, useState } from "react";
import type { Annotation, AnnotationSetType } from "../../../types/Viewer";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import AnnotationSets from "./AnnotationSets";
import Loading from "../../Loading";
import validateAnnotationsJSON from "./utils/validateAnnotationsJSON";

import { viewerProvider } from "@qureai/react-dicom-viewer";
import AnnotationSet from "./AnnotationSet";
function AnnotationPanel({
    patient_id,
    study_id,
    series_id,
}: {
    patient_id: string;
    study_id: string;
    series_id: string;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [annotationSets, setAnnotationSets] = useState<AnnotationSetType[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>();
    const [activeAnnotationSetId, setActiveAnnotationSetId] = useState<string | null>(null);

    useEffect(() => {
        if (!patient_id || !study_id || !series_id) {
            return;
        }
        fetchAnnotationSets();
    }, [patient_id, study_id, series_id]);

    const fetchAnnotationSets = async () => {
        const { data } = await apiClient.get(API_PATHS.ANNOTATIONS_FOR_SERIES(patient_id, study_id, series_id))
        setAnnotationSets(data);
        setIsLoading(false);
    }

    const startAddingAnnotations = () => {
        setAnnotations([]);
        viewerProvider.annotationHandler.startAddingAnnotation({
            callback: () => {
                const annotations =
                    viewerProvider.annotationHandler.getAnnotationsForActiveViewport();
                setAnnotations(annotations ?? []);
            },
            callbackTimeoutDelay: 1000,
        });
    }

    const stopAddingAnnotations = () => {
        viewerProvider.annotationHandler.removeAllAnnotations();
        viewerProvider.annotationHandler.stopAddingAnnotation();
        setAnnotations(undefined);
    }

    const handleAnnotationSetClick = async (annotationSetId: string) => {
        setActiveAnnotationSetId(annotationSetId);
        viewerProvider.annotationHandler.removeAllAnnotations();
        startAddingAnnotations();
        setIsLoading(true);
        const { data: { url } } = await apiClient.get(API_PATHS.ANNOTATION_SET(patient_id, study_id, series_id, annotationSetId));
        const annotations = await (await fetch(url)).json();
        const isValid = validateAnnotationsJSON(annotations);
        if (!isValid) {
            return;
        }
        const addedAnnotations = viewerProvider.annotationHandler.addAnnotations(annotations)
        setAnnotations(addedAnnotations ?? []);
        setIsLoading(false);
    }

    const handleAddNewAnnotationSetClick = () => {
        startAddingAnnotations();
        setActiveAnnotationSetId("new-annotation-set");
    }

    const handleCancelAddingAnnotationSet = () => {
        stopAddingAnnotations();
        setActiveAnnotationSetId(null);
    }

    const handleAnnotationDelete = (annotationUID: string) => {
        if (!annotations) {
            return;
        }
        viewerProvider.annotationHandler.deleteAnnotationForActiveViewport({
            annotationUID,
        });
        const updatedAnnotations = annotations.filter((annotation) => annotation.annotationUID !== annotationUID);
        setAnnotations(updatedAnnotations);
    }

    const handleSaveAnnotations = async () => {
        if (!activeAnnotationSetId || !annotations) {
            return;
        }
        setIsLoading(true);
        const data = {
            annotationSetId: activeAnnotationSetId,
            annotations: annotations.map((annotation) => ({
                toolName: annotation.toolName,
                sliceIndex: annotation.sliceIndex,
                points: annotation.points,
            })),
        }
        await apiClient.post(API_PATHS.ANNOTATIONS_FOR_SERIES(patient_id, study_id, series_id), data);
        await fetchAnnotationSets();
    }

    const handleDeleteAnnotationSet = async(annotationSetId: string) => {
        setIsLoading(true);
        await apiClient.delete(API_PATHS.ANNOTATION_SET(patient_id, study_id, series_id, annotationSetId));
        await fetchAnnotationSets();
    }

    return (
        <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface-soft)] backdrop-blur-[12px]">
            <header className="shrink-0 h-14.5 border-b border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 flex items-center justify-between">
                <h1 className="font-semibold uppercase tracking-tight text-[var(--text)]">
                    Annotations
                </h1>
                {
                    !isLoading && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                            {annotationSets.length}
                        </span>
                    )
                }
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                {isLoading ? (
                    <div className="h-full">
                        <Loading size="lg" />
                    </div>
                ) : annotations ? (
                    <AnnotationSet
                        annotations={annotations}
                        handleSaveAnnotations={handleSaveAnnotations}
                        handleCancelAddingAnnotationSet={handleCancelAddingAnnotationSet}
                        handleAnnotationDelete={handleAnnotationDelete}
                    />
                ) : (
                    <AnnotationSets
                        annotationSets={annotationSets}
                        handleAddNewAnnotationSetClick={handleAddNewAnnotationSetClick}
                        handleAnnotationSetClick={handleAnnotationSetClick}
                        handleDeleteAnnotationSet={handleDeleteAnnotationSet}
                    />
                )
                }
            </div>
        </aside>
    )
}

export default AnnotationPanel;