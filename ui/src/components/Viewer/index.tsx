import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { viewerProvider, Viewer, Toolbar } from "@qureai/react-dicom-viewer";
import MetadataExplorer from "./MetadataExplorer/index.tsx";
import Loading from "../Loading/index.tsx";
import type { SeriesDetail } from "../../types/Viewer.ts";
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

function ViewerComponent() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { isMobile } = useDevice();

  const [searchParams] = useSearchParams();
  const studyId = searchParams.get("studyId");
  const seriesId = searchParams.get("seriesId");
  const projectId = searchParams.get("projectId");

  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [isMetadataExplorerOpen, setIsMetadataExplorerOpen] = useState(false);
  const [isSeriesPanelOpen, setIsSeriesPanelOpen] = useState(false);
  const [isAnnotationPanelOpen, setIsAnnotationPanelOpen] = useState(false);

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

    const metadataUrl = series.metadata_url;
    fetch(metadataUrl)
      .then((res) => res.json())
      .then((metadata) => {
        const imageIds: string[] = [];

        for (const instance of series.instances) {
          const instanceId = instance.id;
          metadata[instanceId]["00280008"] = {
            vr: "IS",
            Value: [1],
          };

          const numberOfFrames = parseInt(instance.NumberOfFrames || "1");
          for (let i = 0; i < numberOfFrames; i++) {
            const imageId = "wadors:" + instance.urls_dicomweb[i];
            imageIds.push(imageId);
            viewerProvider.metadata.wadors.addMetadataForImageId({
              imageId,
              metadata: metadata[instanceId],
            });
          }
        }

        if (VOLUME_MODALITIES.includes(series.Modality)) {
          viewerProvider.retrieveConfiguration.setVolumeViewportRetrieveConfiguration(
            volumeViewportRetrieveConfiguration,
          );
          viewerProvider.renderSeries({
            imageIds,
            scanIdentifier: series.SeriesInstanceUID,
            viewportType: viewerProvider.utils.viewportTypes.ORTHOGRAPHIC,
          });
        } else {
          if (series.instances.length > 1) {
            viewerProvider.retrieveConfiguration.setStackViewportRetrieveConfiguration(
              {},
            );
            viewerProvider.renderSeries({
              imageIds,
              scanIdentifier: series.SeriesInstanceUID,
              viewportType: viewerProvider.utils.viewportTypes.STACK,
            });
          } else {
            viewerProvider.retrieveConfiguration.setStackViewportRetrieveConfiguration(
              stackViewportRetrieveConfiguration,
            );
            viewerProvider.renderSeries({
              imageIds,
              scanIdentifier: series.SeriesInstanceUID,
              viewportType: viewerProvider.utils.viewportTypes.STACK,
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching metadata:", error);
        series.instances.sort(
          (a, b) => parseInt(a.InstanceNumber) - parseInt(b.InstanceNumber),
        );

        const imageIds: string[] = [];
        for (const instance of series.instances) {
          const imageIdBase = `wadouri:${instance.url_p10}`;
          const numberOfFrames = parseInt(instance.NumberOfFrames || "1");
          for (let i = 1; i < numberOfFrames + 1; i++) {
            const ImageId = `${imageIdBase}&frame=${i}`;
            imageIds.push(ImageId);
          }
        }

        viewerProvider.renderSeries({
          imageIds,
          scanIdentifier: series.SeriesInstanceUID,
          viewportType: viewerProvider.utils.viewportTypes.STACK,
        });
      });
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
    setIsAnnotationPanelOpen(false);
    setIsSeriesPanelOpen(true);
  };

  const openAnnotationPanel = () => {
    setIsSeriesPanelOpen(false);
    setIsAnnotationPanelOpen(true);
  };

  if (!patientId) {
    return null;
  }

  const hasAnnotationPanel = Boolean(projectId && studyId && seriesId);

  return (
    <div
      className={[
        "relative flex h-full min-h-0 flex-col overflow-hidden md:grid md:grid-cols-[15rem_minmax(0,1fr)] lg:flex lg:flex-row",
        hasAnnotationPanel
          ? "md:grid-rows-[minmax(0,1fr)_18rem]"
          : "md:grid-rows-[minmax(0,1fr)]",
      ].join(" ")}
    >
      {!isMobile && (
        <div
          className={[
            "h-36 min-h-0 shrink-0 sm:h-44 md:h-auto lg:w-1/5",
            hasAnnotationPanel ? "md:row-span-2" : "md:row-span-1",
          ].join(" ")}
        >
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
        <div className="shrink-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-soft)]">
          <Toolbar />
        </div>
        <div className="relative flex min-h-0 grow bg-black">
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
                  onOpenMetadataExplorer={() => setIsMetadataExplorerOpen(true)}
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

          {isMobile &&
            isViewerInitialized &&
            hasAnnotationPanel &&
            projectId &&
            studyId &&
            seriesId && (
              <div
                className={[
                  "absolute inset-0 z-40 flex justify-end transition-colors",
                  isAnnotationPanelOpen
                    ? "pointer-events-auto bg-black/55 backdrop-blur-[2px]"
                    : "pointer-events-none bg-transparent",
                ].join(" ")}
              >
                {isAnnotationPanelOpen && (
                  <button
                    type="button"
                    onClick={() => setIsAnnotationPanelOpen(false)}
                    aria-label="Close annotations panel"
                    className="min-w-0 flex-1 cursor-default"
                  />
                )}
                <div
                  aria-hidden={!isAnnotationPanelOpen}
                  inert={!isAnnotationPanelOpen}
                  className={[
                    "h-full w-[92vw] max-w-md min-w-0 transition-transform duration-200 ease-out",
                    isAnnotationPanelOpen
                      ? "translate-x-0"
                      : "translate-x-full",
                  ].join(" ")}
                >
                  <AnnotationPanel
                    isMobile={isMobile}
                    isSeriesLoading={isSeriesLoading}
                    projectId={projectId}
                    patientId={patientId}
                    studyId={studyId}
                    seriesId={seriesId}
                    onClose={() => setIsAnnotationPanelOpen(false)}
                  />
                </div>
              </div>
            )}
        </div>

        {isMobile && (
          <div
            className={[
              "grid h-14 shrink-0 gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-2",
              hasAnnotationPanel ? "grid-cols-2" : "grid-cols-1",
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
                className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/60 hover:bg-[var(--surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardListIcon className="size-4 shrink-0" />
                <span className="truncate">Annotations</span>
              </button>
            ) : null}
          </div>
        )}

        {isSeriesLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <Loading size="lg" />
          </div>
        )}
      </div>

      {!isMobile && hasAnnotationPanel && projectId && studyId && seriesId && (
        <div className="h-64 min-h-0 shrink-0 sm:h-72 md:col-start-2 md:row-start-2 md:h-auto lg:w-1/4">
          {isViewerInitialized && (
            <div className="h-full">
              <AnnotationPanel
                isMobile={isMobile}
                isSeriesLoading={isSeriesLoading}
                projectId={projectId}
                patientId={patientId}
                studyId={studyId}
                seriesId={seriesId}
              />
            </div>
          )}
        </div>
      )}

      {isViewerInitialized && isMetadataExplorerOpen && (
        <div className="fixed top-0 right-0 h-full w-full z-50 bg-black/50">
          <MetadataExplorer onClose={() => setIsMetadataExplorerOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default ViewerComponent;
