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

  return (
    <div className="flex h-full">
      <div className="w-1/5">
        {isViewerInitialized && (
          <SeriesPanel
            patientId={patientId}
            seriesId={seriesId}
            onClickSeries={onClickSeries}
            onOpenMetadataExplorer={() => setIsMetadataExplorerOpen(true)}
          />
        )}
      </div>
      <div className="flex flex-col h-full w-0 grow shrink">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
          <Toolbar />
        </div>
        <div className="grow flex bg-black">
          <Viewer onInitialized={handleViewerInitialized} />
        </div>

        {isSeriesLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loading size="lg" />
          </div>
        )}
      </div>

      {projectId && studyId && seriesId && (
        <div className="w-1/4">
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
