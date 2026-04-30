import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { viewerProvider, Viewer, Toolbar } from "@qureai/react-dicom-viewer";
import type { Series } from "../../types/Patient";
import AnnotationPanel from "./AnnotationPanel/index.tsx";
import { VIEWER_MODES } from "../../utils/constants.ts";
import SeriesPanel from "./SeriesPanel/index.tsx";
import MetadataExplorer from "./MetadataExplorer/index.tsx";
import Loading from "../Loading/index.tsx";

function ViewerComponent() {
    const navigate = useNavigate();
    const { patient_id, study_id, series_id } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");

    const [isViewerInitialized, setIsViewerInitialized] = useState(false);
    const [isSeriesLoading, setIsSeriesLoading] = useState(true);
    const [series, setSeries] = useState<Series | null>(null);
    const [isMetadataExplorerOpen, setIsMetadataExplorerOpen] = useState(false);

    useEffect(() => {
        if (!patient_id || !study_id || !series_id) {
            return;
        }
        setIsSeriesLoading(true);
        apiClient
            .get(API_PATHS.SERIES(patient_id, study_id, series_id))
            .then((response) => {
                setSeries(response.data);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsSeriesLoading(false);
            });
    }, [patient_id, study_id, series_id]);

    useEffect(() => {
        if (!isViewerInitialized) return;
        if (!series) return;

        series.instances.sort((a, b) => parseInt(a.InstanceNumber) - parseInt(b.InstanceNumber));

        const imageIds: string[] = [];
        for (const instance of series.instances) {
            const imageId = `wadouri:${instance.url_p10}`;
            imageIds.push(imageId);
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

    const onClickSeries = ({ study_id, series_id }: { study_id: string; series_id: string }) => {
        if (!patient_id || !study_id || !series_id) {
            return;
        }
        navigate(UI_PATHS.VIEWER({ params: { patient_id, study_id, series_id }, query: { mode: VIEWER_MODES.VIEW } }));
    };

    if (!patient_id || !study_id || !series_id) {
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

                {
                    isSeriesLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loading size="lg" />
                        </div>
                    )
                }
            </div>

            <div className="w-1/4">
                {
                    isViewerInitialized && (
                        <div className="h-full">
                            {
                                mode === VIEWER_MODES.ANNOTATE && (
                                    (
                                        <AnnotationPanel
                                            patient_id={patient_id}
                                            study_id={study_id}
                                            series_id={series_id}
                                        />
                                    )
                                )
                            }
                            {
                                mode === VIEWER_MODES.VIEW && (
                                    <SeriesPanel
                                        patient_id={patient_id}
                                        series_id={series_id}
                                        onClickSeries={onClickSeries}
                                        onOpenMetadataExplorer={() =>
                                            setIsMetadataExplorerOpen(true)
                                        }
                                    />
                                )
                            }
                        </div>
                    )
                }
            </div>

            {
                isViewerInitialized && isMetadataExplorerOpen && (
                    <div className="fixed top-0 right-0 h-full w-full z-50 bg-black/50">
                        <MetadataExplorer
                            onClose={() => setIsMetadataExplorerOpen(false)}
                        />
                    </div>
                )
            }
        </div>
    );
}

export default ViewerComponent;
