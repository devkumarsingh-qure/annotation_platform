import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import {
  viewerProvider,
  Viewer,
  Toolbar,
  type ExportedSegmentation,
} from "@qureai/react-dicom-viewer";
import MetadataExplorer from "./MetadataExplorer/index.tsx";
import Loading from "../Loading/index.tsx";
import type {
  SegmentationMaskSummary,
  SeriesDetail,
} from "../../types/Viewer.ts";
import AnnotationPanel from "./AnnotationPanel/index.tsx";
import SeriesPanel from "./SeriesPanel/index.tsx";
import {
  stackViewportRetrieveConfiguration,
  volumeViewportRetrieveConfiguration,
} from "./utils/configs.ts";
import { VOLUME_MODALITIES } from "./utils/constants.ts";
import { useDevice } from "../../contexts/device/deviceContext.ts";
import StackIcon from "../../icons/StackIcon";
import ClipboardListIcon from "../../icons/ClipboardListIcon";
import PenIcon from "../../icons/PenIcon.tsx";
import { toastError, toastSuccess } from "../../utils/toast.ts";
import SegmentationPanel from "./SegmentationPanel/index.tsx";
import {
  downloadDicomSegmentation,
  prepareSegmentationUpload,
} from "./utils/segmentationPersistence.ts";

type ViewerWorkspace = "choose" | "annotations" | "segmentations" | null;

type DicomJsonElement = {
  Value?: unknown[];
  [key: string]: unknown;
};

type DicomJsonMetadata = Record<string, DicomJsonElement>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFrameCount(value: string | null | undefined) {
  const count = Number.parseInt(value || "1", 10);
  return Number.isFinite(count) && count > 0 ? count : 1;
}

function getInstanceMetadata(
  payload: unknown,
  instance: SeriesDetail["instances"][number],
): DicomJsonMetadata | undefined {
  if (!isRecord(payload)) return;

  const directMatch =
    payload[String(instance.id)] ?? payload[instance.SOPInstanceUID];
  if (isRecord(directMatch)) return directMatch as DicomJsonMetadata;

  return Object.values(payload).find((candidate) => {
    if (!isRecord(candidate)) return false;
    const sopInstanceUid = candidate["00080018"];
    if (!isRecord(sopInstanceUid) || !Array.isArray(sopInstanceUid.Value)) {
      return false;
    }
    return String(sopInstanceUid.Value[0]) === instance.SOPInstanceUID;
  }) as DicomJsonMetadata | undefined;
}

function getP10ImageIds(series: SeriesDetail) {
  return [...series.instances]
    .sort(
      (a, b) =>
        Number.parseInt(a.InstanceNumber || "0", 10) -
        Number.parseInt(b.InstanceNumber || "0", 10),
    )
    .flatMap((instance) => {
      const imageId = `wadouri:${instance.url_p10}`;
      const numberOfFrames = getFrameCount(instance.NumberOfFrames);
      if (numberOfFrames === 1) return [imageId];

      const separator = instance.url_p10.includes("?") ? "&" : "?";
      return Array.from(
        { length: numberOfFrames },
        (_, frameIndex) => `${imageId}${separator}frame=${frameIndex + 1}`,
      );
    });
}

function WorkspaceChoicePanel({
  onSelect,
  onClose,
}: {
  onSelect: (workspace: Exclude<ViewerWorkspace, "choose" | null>) => void;
  onClose: () => void;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface-strong)] lg:w-[22rem]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Choose a workspace
          </h2>
          <p className="text-[10px] text-[var(--muted)]">
            You can switch at any time
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
        >
          View only
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto p-4">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          What would you like to work on for this series?
        </p>

        <button
          type="button"
          onClick={() => onSelect("annotations")}
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/55 p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <ClipboardListIcon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--text)]">
                Annotations
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                Draw measurements and regions, then save them as an annotation
                set.
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("segmentations")}
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/55 p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <PenIcon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--text)]">
                Segmentations
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                Paint pixel-level masks, inspect metrics, and save a DICOM SEG.
              </span>
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}

function ViewerComponent() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { isMobile } = useDevice();

  const [searchParams] = useSearchParams();
  const studyId = searchParams.get("studyId");
  const seriesId = searchParams.get("seriesId");
  const projectId = searchParams.get("projectId");
  const hasAnnotationPanel = Boolean(projectId && studyId && seriesId);

  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [isMetadataExplorerOpen, setIsMetadataExplorerOpen] = useState(false);
  const [isSeriesPanelOpen, setIsSeriesPanelOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<ViewerWorkspace>(
    projectId ? "choose" : null,
  );
  const [segmentationMaskCollection, setSegmentationMaskCollection] = useState<{
    source: string;
    masks: SegmentationMaskSummary[];
  }>();
  const [segmentationSaveStatus, setSegmentationSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("unsaved");

  useEffect(() => {
    if (!patientId) {
      return;
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId || !studyId || !seriesId) {
      return;
    }
    setIsSeriesLoading(true);
    apiClient
      .get(API_PATHS.SERIES(patientId, studyId, seriesId))
      .then((response) => {
        setSeries(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsSeriesLoading(false);
      });
  }, [patientId, studyId, seriesId]);

  useEffect(() => {
    if (!isViewerInitialized) return;
    if (!series) return;

    const abortController = new AbortController();
    let cancelled = false;

    const loadSeries = async () => {
      let imageIds: string[];
      let hasCompleteDicomWebMetadata = true;

      try {
        const response = await fetch(series.metadata_url, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error(`Metadata request failed with ${response.status}`);
        }
        const metadata: unknown = await response.json();
        const dicomWebImageIds: string[] = [];

        for (const instance of series.instances) {
          const instanceMetadata = getInstanceMetadata(metadata, instance);
          if (!instanceMetadata) {
            throw new Error(
              `Metadata is missing for DICOM instance ${instance.SOPInstanceUID}`,
            );
          }

          const numberOfFrames = getFrameCount(instance.NumberOfFrames);
          if (instance.urls_dicomweb.length < numberOfFrames) {
            throw new Error(
              `DICOMweb frames are missing for instance ${instance.SOPInstanceUID}`,
            );
          }

          const frameMetadata: DicomJsonMetadata = {
            ...instanceMetadata,
            "00280008": {
              vr: "IS",
              Value: [1],
            },
          };

          for (let i = 0; i < numberOfFrames; i++) {
            const imageId = "wadors:" + instance.urls_dicomweb[i];
            dicomWebImageIds.push(imageId);
            viewerProvider.metadata.wadors.addMetadataForImageId({
              imageId,
              metadata: frameMetadata,
            });
          }
        }

        imageIds = dicomWebImageIds;
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.warn(
          "DICOMweb metadata unavailable; using Part 10 files:",
          error,
        );
        hasCompleteDicomWebMetadata = false;
        imageIds = getP10ImageIds(series);
      }

      if (cancelled || !imageIds.length) return;

      const useVolumeViewport =
        hasCompleteDicomWebMetadata &&
        VOLUME_MODALITIES.includes(series.Modality);

      if (useVolumeViewport) {
        viewerProvider.retrieveConfiguration.setVolumeViewportRetrieveConfiguration(
          volumeViewportRetrieveConfiguration,
        );
      } else if (series.instances.length > 1) {
        viewerProvider.retrieveConfiguration.setStackViewportRetrieveConfiguration(
          {},
        );
      } else {
        viewerProvider.retrieveConfiguration.setStackViewportRetrieveConfiguration(
          stackViewportRetrieveConfiguration,
        );
      }

      await viewerProvider.renderSeries({
        imageIds,
        scanIdentifier: series.SeriesInstanceUID,
        viewportType: useVolumeViewport
          ? viewerProvider.utils.viewportTypes.ORTHOGRAPHIC
          : viewerProvider.utils.viewportTypes.STACK,
      });
    };

    void loadSeries().catch((error) => {
      if (!cancelled) {
        console.error("Error rendering series:", error);
      }
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [isViewerInitialized, series]);

  const handleViewerInitialized = () => {
    setIsViewerInitialized(true);
  };

  const onClickSeries = ({
    studyId,
    seriesId,
  }: {
    studyId: string;
    seriesId: string;
  }) => {
    if (!patientId || !studyId || !seriesId) {
      return;
    }
    navigate(
      UI_PATHS.VIEWER({
        patientId: patientId,
        studyId: studyId,
        seriesId: seriesId,
        projectId: projectId ?? undefined,
      }),
    );
  };

  const handleSeriesPanelClick = ({
    studyId,
    seriesId,
  }: {
    studyId: string;
    seriesId: string;
  }) => {
    onClickSeries({ studyId, seriesId });
    if (isMobile) {
      setIsSeriesPanelOpen(false);
    }
  };

  const openSeriesPanel = () => {
    setActiveWorkspace(null);
    setIsSeriesPanelOpen(true);
  };

  const openAnnotationPanel = () => {
    setIsSeriesPanelOpen(false);
    setActiveWorkspace("annotations");
  };

  const openSegmentationPanel = () => {
    setIsSeriesPanelOpen(false);
    setActiveWorkspace("segmentations");
  };

  const segmentationCollectionUrl =
    projectId && patientId && studyId && seriesId
      ? API_PATHS.SEGMENTATIONS_FOR_SERIES(
          projectId,
          patientId,
          studyId,
          seriesId,
        )
      : null;

  const segmentationDetailUrl = (maskId: string) => {
    if (!projectId || !patientId || !studyId || !seriesId) {
      return null;
    }
    return API_PATHS.SEGMENTATION_MASK(
      projectId,
      patientId,
      studyId,
      seriesId,
      maskId,
    );
  };

  useEffect(() => {
    if (!isViewerInitialized || !segmentationCollectionUrl) return;

    const source = segmentationCollectionUrl;
    let cancelled = false;
    void apiClient
      .get<{
        segmentation_masks: SegmentationMaskSummary[];
      }>(source)
      .then(({ data }) => {
        if (cancelled) return;
        setSegmentationMaskCollection({
          source,
          masks: data.segmentation_masks,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to fetch segmentation masks", error);
        toastError("Could not fetch saved segmentation masks.");
      });

    return () => {
      cancelled = true;
    };
  }, [isViewerInitialized, segmentationCollectionUrl]);

  const segmentationMasks =
    segmentationMaskCollection?.source === segmentationCollectionUrl
      ? segmentationMaskCollection.masks
      : [];
  const areSegmentationMasksLoading = Boolean(
    segmentationCollectionUrl &&
    segmentationMaskCollection?.source !== segmentationCollectionUrl,
  );

  const handleSaveSegmentation = async (
    exported: ExportedSegmentation,
    sourceMask?: SegmentationMaskSummary,
  ) => {
    const existingMaskId = sourceMask?.id;
    try {
      if (!segmentationCollectionUrl) {
        await downloadDicomSegmentation(exported);
        toastSuccess("DICOM SEG downloaded.");
        return undefined;
      }

      setSegmentationSaveStatus("saving");
      const formData = await prepareSegmentationUpload(exported);
      const detailUrl = existingMaskId
        ? segmentationDetailUrl(existingMaskId)
        : null;
      const { data: saved } = detailUrl
        ? await apiClient.put<SegmentationMaskSummary>(detailUrl, formData)
        : await apiClient.post<SegmentationMaskSummary>(
            segmentationCollectionUrl,
            formData,
          );
      setSegmentationMaskCollection((current) => {
        const currentMasks =
          current?.source === segmentationCollectionUrl ? current.masks : [];
        return {
          source: segmentationCollectionUrl,
          masks: [
            saved,
            ...currentMasks.filter((mask) => mask.id !== saved.id),
          ],
        };
      });
      setSegmentationSaveStatus("saved");
      toastSuccess(
        existingMaskId ? "Segmentation updated." : "Segmentation saved.",
      );
      return saved;
    } catch (error) {
      console.error("Failed to save segmentation", error);
      if (segmentationCollectionUrl) {
        setSegmentationSaveStatus("unsaved");
      }
      toastError("Could not save the segmentation mask.");
      throw error;
    }
  };

  const handleDeleteSegmentation = async (mask: SegmentationMaskSummary) => {
    const detailUrl = segmentationDetailUrl(mask.id);
    if (!detailUrl || !segmentationCollectionUrl) {
      throw new Error("The segmentation API is not available.");
    }
    try {
      await apiClient.delete(detailUrl);
      setSegmentationMaskCollection((current) => ({
        source: segmentationCollectionUrl,
        masks:
          current?.source === segmentationCollectionUrl
            ? current.masks.filter((item) => item.id !== mask.id)
            : [],
      }));
      toastSuccess("Segmentation deleted.");
    } catch (error) {
      console.error("Failed to delete segmentation", error);
      toastError("Could not delete the segmentation.");
      throw error;
    }
  };

  if (!patientId) {
    return null;
  }

  const isWorkspaceOpen =
    activeWorkspace === "choose"
      ? hasAnnotationPanel
      : activeWorkspace !== null;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] lg:flex lg:flex-row">
      {!isMobile && (
        <div className="h-36 min-h-0 shrink-0 sm:h-44 md:h-auto lg:w-1/5">
          {isViewerInitialized && (
            <SeriesPanel
              isMobile={isMobile}
              patientId={patientId}
              seriesId={seriesId}
              onClickSeries={onClickSeries}
              onOpenMetadataExplorer={() => setIsMetadataExplorerOpen(true)}
            />
          )}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 shrink flex-col md:col-start-2 md:row-start-1 lg:h-full lg:w-0">
        <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--surface-soft)]">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <Toolbar />
          </div>
          {hasAnnotationPanel && (
            <button
              type="button"
              onClick={openAnnotationPanel}
              disabled={!isViewerInitialized || isSeriesLoading}
              aria-pressed={activeWorkspace === "annotations"}
              title="Open annotations workspace"
              className={[
                "inline-flex shrink-0 items-center gap-2 border-l border-[var(--border)] px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
                activeWorkspace === "annotations"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface-strong)]",
              ].join(" ")}
            >
              <ClipboardListIcon className="size-4" />
              <span className="hidden xl:inline">Annotate</span>
            </button>
          )}
          <button
            type="button"
            onClick={openSegmentationPanel}
            disabled={!isViewerInitialized || isSeriesLoading}
            aria-pressed={activeWorkspace === "segmentations"}
            title="Open segmentation workspace"
            className={[
              "inline-flex shrink-0 items-center gap-2 border-l border-[var(--border)] px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
              activeWorkspace === "segmentations"
                ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "bg-[var(--surface-soft)] text-[var(--text)] hover:bg-[var(--surface-strong)]",
            ].join(" ")}
          >
            <PenIcon className="size-4" />
            <span className="hidden sm:inline">Segment</span>
          </button>
        </div>
        <div className="flex min-h-0 grow">
          <div
            className={[
              "relative min-h-0 min-w-0 grow bg-black",
              isWorkspaceOpen ? "hidden lg:flex" : "flex",
            ].join(" ")}
          >
            <Viewer onInitialized={handleViewerInitialized} />

            {isMobile && isViewerInitialized && (
              <div
                className={[
                  "absolute inset-0 z-40 flex transition-colors",
                  isSeriesPanelOpen
                    ? "pointer-events-auto bg-black/55 backdrop-blur-[2px]"
                    : "pointer-events-none bg-transparent",
                ].join(" ")}
              >
                <div
                  aria-hidden={!isSeriesPanelOpen}
                  inert={!isSeriesPanelOpen}
                  className={[
                    "h-full w-[86vw] max-w-sm min-w-0 transition-transform duration-200 ease-out",
                    isSeriesPanelOpen ? "translate-x-0" : "-translate-x-full",
                  ].join(" ")}
                >
                  <SeriesPanel
                    isMobile={isMobile}
                    patientId={patientId}
                    seriesId={seriesId}
                    onClickSeries={handleSeriesPanelClick}
                    onOpenMetadataExplorer={() =>
                      setIsMetadataExplorerOpen(true)
                    }
                    onClose={() => setIsSeriesPanelOpen(false)}
                  />
                </div>
                {isSeriesPanelOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSeriesPanelOpen(false)}
                    aria-label="Close studies panel"
                    className="min-w-0 flex-1 cursor-default"
                  />
                )}
              </div>
            )}

            {isSeriesLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                <Loading size="lg" />
              </div>
            )}
          </div>

          {isViewerInitialized &&
            hasAnnotationPanel &&
            activeWorkspace === "choose" && (
              <WorkspaceChoicePanel
                onSelect={setActiveWorkspace}
                onClose={() => setActiveWorkspace(null)}
              />
            )}

          {isViewerInitialized &&
            hasAnnotationPanel &&
            projectId &&
            studyId &&
            seriesId && (
              <div
                inert={activeWorkspace !== "annotations"}
                className={[
                  "h-full min-h-0 w-full shrink-0 lg:w-[22rem]",
                  activeWorkspace === "annotations" ? "block" : "hidden",
                ].join(" ")}
              >
                <AnnotationPanel
                  isMobile={isMobile}
                  isSeriesLoading={isSeriesLoading}
                  projectId={projectId}
                  patientId={patientId}
                  studyId={studyId}
                  seriesId={seriesId}
                  onClose={() => setActiveWorkspace(null)}
                />
              </div>
            )}

          {isViewerInitialized && (
            <SegmentationPanel
              isOpen={activeWorkspace === "segmentations"}
              masks={segmentationMasks}
              isLoading={areSegmentationMasksLoading}
              saveStatus={segmentationSaveStatus}
              onSave={handleSaveSegmentation}
              onDelete={handleDeleteSegmentation}
              onClose={() => setActiveWorkspace(null)}
            />
          )}
        </div>

        {isMobile && (
          <div
            className={[
              "grid h-14 shrink-0 gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-2",
              hasAnnotationPanel ? "grid-cols-3" : "grid-cols-2",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={openSeriesPanel}
              disabled={!isViewerInitialized}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/60 hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <StackIcon className="size-4 shrink-0" />
              <span className="truncate">Series</span>
            </button>
            {hasAnnotationPanel ? (
              <button
                type="button"
                onClick={openAnnotationPanel}
                disabled={!isViewerInitialized}
                className={[
                  "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
                  activeWorkspace === "annotations"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-strong)]",
                ].join(" ")}
              >
                <ClipboardListIcon className="size-4 shrink-0" />
                <span className="truncate">Annotations</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={openSegmentationPanel}
              disabled={!isViewerInitialized || isSeriesLoading}
              className={[
                "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
                activeWorkspace === "segmentations"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-strong)]",
              ].join(" ")}
            >
              <PenIcon className="size-4 shrink-0" />
              <span className="truncate">Segments</span>
            </button>
          </div>
        )}
      </div>

      {isViewerInitialized && isMetadataExplorerOpen && (
        <div className="fixed top-0 right-0 h-full w-full z-50 bg-black/50">
          <MetadataExplorer onClose={() => setIsMetadataExplorerOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default ViewerComponent;
