import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { viewerProvider, Viewer, Toolbar } from "@qureai/react-dicom-viewer";
//import AnnotationPanel from "./AnnotationPanel/index.tsx";
import { VIEWER_MODES } from "../../utils/constants.ts";
import SeriesPanel from "./SeriesPanel/index.tsx";
import MetadataExplorer from "./MetadataExplorer/index.tsx";
import Loading from "../Loading/index.tsx";
import type { SeriesDetail } from "../../types/Viewer.ts";

function ViewerComponent() {
  const navigate = useNavigate();
  const { patientId, studyId, seriesId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

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
        mode: VIEWER_MODES.VIEW,
      }),
    );
  };

  if (!patientId || !studyId || !seriesId) {
    return null;
  }

  return (
    <div className="flex h-full">
      <div className="relative flex flex-col h-full w-0 grow shrink">
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

      <div className="w-1/4">
        {isViewerInitialized && (
          <div className="h-full">
            {/*{
                                mode === VIEWER_MODES.ANNOTATE && (
                                    (
                                        <AnnotationPanel
                                            patientId={patientId}
                                            studyId={studyId}
                                            seriesId={seriesId}
                                        />
                                    )
                                )
                            }*/}
            {mode === VIEWER_MODES.VIEW && (
              <SeriesPanel
                patientId={patientId}
                seriesId={seriesId}
                onClickSeries={onClickSeries}
                onOpenMetadataExplorer={() => setIsMetadataExplorerOpen(true)}
              />
            )}
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
