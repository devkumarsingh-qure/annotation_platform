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

function ViewerComponent() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [searchParams] = useSearchParams();
  const studyId = searchParams.get("studyId");
  const seriesId = searchParams.get("seriesId");
  const projectId = searchParams.get("projectId");

  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [isMetadataExplorerOpen, setIsMetadataExplorerOpen] = useState(false);

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
      <div
        className={[
          "h-36 min-h-0 shrink-0 sm:h-44 md:h-auto lg:w-1/5",
          hasAnnotationPanel ? "md:row-span-2" : "md:row-span-1",
        ].join(" ")}
      >
        {isViewerInitialized && (
          <SeriesPanel
            patientId={patientId}
            seriesId={seriesId}
            onClickSeries={onClickSeries}
            onOpenMetadataExplorer={() => setIsMetadataExplorerOpen(true)}
          />
        )}
      </div>
      <div className="relative flex min-h-0 flex-1 shrink flex-col md:col-start-2 md:row-start-1 lg:h-full lg:w-0">
        <div className="shrink-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-soft)]">
          <Toolbar />
        </div>
        <div className="flex min-h-0 grow bg-black">
          <Viewer onInitialized={handleViewerInitialized} />
        </div>

        {isSeriesLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loading size="lg" />
          </div>
        )}
      </div>

      {hasAnnotationPanel && projectId && studyId && seriesId && (
        <div className="h-64 min-h-0 shrink-0 sm:h-72 md:col-start-2 md:row-start-2 md:h-auto lg:w-1/4">
          {isViewerInitialized && (
            <div className="h-full">
              <AnnotationPanel
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
