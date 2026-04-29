import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { API_PATHS } from "../../utils/urls";
import { viewerProvider, Viewer, Toolbar } from "@qureai/react-dicom-viewer";
import type { Series } from "../../types/Patient";
import AnnotationPanel from "./AnnotationPanel/index.tsx";
import { VIEWER_MODES } from "../../utils/constants.ts";

function ViewerComponent() {
    const { patient_id, study_id, series_id } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");

    const [isViewerInitialized, setIsViewerInitialized] = useState(false);
    const [series, setSeries] = useState<Series | null>(null);

    useEffect(() => {
        if (!patient_id || !study_id || !series_id) {
            return;
        }

        apiClient
            .get(API_PATHS.SERIES(patient_id, study_id, series_id))
            .then((response) => {
                setSeries(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [patient_id, study_id, series_id]);

    useEffect(() => {
        if (!isViewerInitialized) return;
        if (!series) return;

        const imageIds = [];
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

    if (!patient_id || !study_id || !series_id) {
        return null;
    }

    return (
        <div className="flex h-full">
            <div className="flex flex-col h-full w-0 grow shrink">
                <div className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
                    <Toolbar />
                </div>
                <div className="grow flex bg-black">
                    <Viewer onInitialized={handleViewerInitialized} />
                </div>
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
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default ViewerComponent;
