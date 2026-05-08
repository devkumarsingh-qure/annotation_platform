import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import AnnotationSets from "./AnnotationSets";
import Loading from "../../Loading";
import validateAnnotationsJSON from "./utils/validateAnnotationsJSON";

import { viewerProvider } from "@qureai/react-dicom-viewer";
import AnnotationSet from "./AnnotationSet";
import { NEW_ANNOTATION_SET_ID } from "../../../utils/constants";
import type {
  AnnotationSetsDetails,
  AnnotationDetails,
} from "../../../types/Viewer";
import XIcon from "../../../icons/XIcon";

function AnnotationPanel({
  isSeriesLoading,
  projectId,
  patientId,
  studyId,
  seriesId,
  isMobile = false,
  onClose,
}: {
  isSeriesLoading: boolean;
  projectId: string;
  patientId: string;
  studyId: string;
  seriesId: string;
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [annotationSets, setAnnotationSets] =
    useState<AnnotationSetsDetails | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationDetails[] | null>(
    null,
  );
  const [activeAnnotationSetId, setActiveAnnotationSetId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!projectId || !patientId || !studyId || !seriesId) {
      return;
    }
    fetchAnnotationSets();
  }, [projectId, patientId, studyId, seriesId]);

  const fetchAnnotationSets = async () => {
    const { data } = await apiClient.get(
      API_PATHS.ANNOTATIONS_FOR_SERIES(projectId, patientId, studyId, seriesId),
    );
    setAnnotationSets(data);
    setIsLoading(false);
  };

  const fetchAnnotations = async (
    annotationSetId: string,
  ): Promise<AnnotationDetails[]> => {
    const {
      data: { url },
    } = await apiClient.get(
      API_PATHS.ANNOTATION_SET(
        projectId,
        patientId,
        studyId,
        seriesId,
        annotationSetId,
      ),
    );
    const annotations = await (await fetch(url)).json();
    const isValid = validateAnnotationsJSON(annotations);
    if (!isValid) {
      throw new Error("Invalid annotation file");
    }
    return annotations;
  };

  const startAddingAnnotations = () => {
    viewerProvider.annotationHandler.removeAllAnnotations();
    viewerProvider.annotationHandler.startAddingAnnotation({
      callback: () => {
        const annotations =
          viewerProvider.annotationHandler.getAnnotationsForActiveViewport();
        setAnnotations(annotations ?? []);
      },
      callbackTimeoutDelay: 1000,
    });
  };

  const handleAnnotationSetClick = async (annotationSetId: string) => {
    setActiveAnnotationSetId(annotationSetId);
    viewerProvider.annotationHandler.removeAllAnnotations();
    startAddingAnnotations();
    setIsLoading(true);
    const annotations = await fetchAnnotations(annotationSetId);
    const addedAnnotations =
      viewerProvider.annotationHandler.addAnnotations(annotations);
    setAnnotations(addedAnnotations ?? []);
    setIsLoading(false);
  };

  const handleAddNewAnnotationSetClick = () => {
    setAnnotations([]);
    startAddingAnnotations();
    setActiveAnnotationSetId(NEW_ANNOTATION_SET_ID);
  };

  const handleCancelAddingAnnotationSet = () => {
    viewerProvider.annotationHandler.removeAllAnnotations();
    viewerProvider.annotationHandler.stopAddingAnnotation();
    setAnnotations(null);
    setActiveAnnotationSetId(null);
  };

  const handleAnnotationDelete = (annotationUID: string) => {
    if (!annotations) {
      return;
    }
    viewerProvider.annotationHandler.deleteAnnotationForActiveViewport({
      annotationUID,
    });
    const updatedAnnotations = annotations.filter(
      (annotation) => annotation.annotationUID !== annotationUID,
    );
    setAnnotations(updatedAnnotations);
  };

  const handleSaveAnnotations = async () => {
    if (!activeAnnotationSetId || !annotations) {
      return;
    }
    setIsLoading(true);
    const data = {
      annotation_set_id: activeAnnotationSetId,
      annotations_json: annotations.map((annotation) => ({
        toolName: annotation.toolName,
        sliceIndex: annotation.sliceIndex,
        points: annotation.points,
      })),
    };
    if (activeAnnotationSetId === NEW_ANNOTATION_SET_ID) {
      const {
        data: { id },
      } = await apiClient.post(
        API_PATHS.ANNOTATIONS_FOR_SERIES(
          projectId,
          patientId,
          studyId,
          seriesId,
        ),
        data,
      );
      setActiveAnnotationSetId(String(id));
    } else {
      const {
        data: { id },
      } = await apiClient.put(
        API_PATHS.ANNOTATION_SET(
          projectId,
          patientId,
          studyId,
          seriesId,
          activeAnnotationSetId,
        ),
        data,
      );
      setActiveAnnotationSetId(String(id));
    }
    await fetchAnnotationSets();
  };

  const handleDeleteAnnotationSet = async (annotationSetId: string) => {
    await apiClient.delete(
      API_PATHS.ANNOTATION_SET(
        projectId,
        patientId,
        studyId,
        seriesId,
        annotationSetId,
      ),
    );
    await fetchAnnotationSets();
  };

  const handleDownloadAnnotationSet = async (annotationSetId: string) => {
    if (!annotationSets) {
      return;
    }

    const PatientID = annotationSets.PatientID;
    const StudyInstanceUID = annotationSets.StudyInstanceUID;
    const SeriesInstanceUID = annotationSets.SeriesInstanceUID;

    const annotations = await fetchAnnotations(annotationSetId);

    if (!annotations) {
      return;
    }

    const exportData = {
      PatientID,
      StudyInstanceUID,
      SeriesInstanceUID,
      exportedAt: new Date().toISOString(),
      annotations: annotations.map((annotation) => ({
        toolName: annotation.toolName,
        sliceIndex: annotation.sliceIndex,
        points: annotation.points,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations_${PatientID}_${StudyInstanceUID.slice(0, 8)}_${SeriesInstanceUID.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadAnnotationSet = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const isValid = validateAnnotationsJSON(json.annotations);
        if (isValid) {
          viewerProvider.annotationHandler.removeAllAnnotations();
          const addedAnnotations =
            viewerProvider.annotationHandler.addAnnotations(json.annotations);
          setAnnotations(addedAnnotations || []);
        } else {
          throw new Error("Invalid annotation file");
        }
      } catch (error) {
        console.error("Error parsing annotation file", error);
      }
    };
    reader.readAsText(file);
  };

  if (isSeriesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <aside
      className={[
        "flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[var(--surface)] to-[var(--surface-soft)] backdrop-blur-[12px]",
        isMobile
          ? "border-l border-[var(--border)] shadow-2xl"
          : "border-t border-[var(--border)] lg:border-l lg:border-t-0",
      ].join(" ")}
    >
      <header className="flex h-14 shrink-0 items-center justify-between space-x-2 border-b border-[var(--border)] bg-[var(--surface-strong)] px-3">
        <h1 className="font-semibold uppercase tracking-tight text-[var(--text)]">
          Annotations
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {!isLoading && (
            <span className="h-7 w-7 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[11px] font-medium text-[var(--muted)]">
              {annotationSets?.annotation_sets.length}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close annotations"
              aria-label="Close annotations panel"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]/80 bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--danger)]/50 hover:bg-[var(--danger)]/10 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
        {annotations ? (
          <AnnotationSet
            activeAnnotationSetId={activeAnnotationSetId}
            annotations={annotations}
            handleSaveAnnotations={handleSaveAnnotations}
            handleCancelAddingAnnotationSet={handleCancelAddingAnnotationSet}
            handleAnnotationDelete={handleAnnotationDelete}
            handleUploadAnnotationSet={handleUploadAnnotationSet}
          />
        ) : (
          <AnnotationSets
            annotationSets={annotationSets}
            handleAddNewAnnotationSetClick={handleAddNewAnnotationSetClick}
            handleAnnotationSetClick={handleAnnotationSetClick}
            handleDownloadAnnotationSet={handleDownloadAnnotationSet}
            handleDeleteAnnotationSet={handleDeleteAnnotationSet}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loading size="lg" />
          </div>
        )}
      </div>
    </aside>
  );
}

export default AnnotationPanel;
