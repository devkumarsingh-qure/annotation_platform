import { useEffect, useState } from "react";
import type { Study } from "../../../types/Patient";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import Loading from "../../Loading";
import StackIcon from "../../../icons/StackIcon";
import MetadataExplorerIcon from "../../../icons/MetadataExplorerIcon";

const shortValue = (value: string | null | undefined, maxLength = 36) => {
    if (!value) {
        return "—";
    }
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength)}…`;
};

function instanceCount(series: Study["series"][number]) {
    return series.num_instances ?? series.total_instances ?? 0;
}

function SeriesPanel({
    patient_id,
    series_id,
    onClickSeries,
    onOpenMetadataExplorer,
}: {
    patient_id: string;
    series_id: string;
    onClickSeries: ({
        study_id,
        series_id,
    }: {
        study_id: string;
        series_id: string;
    }) => void;
    onOpenMetadataExplorer: () => void;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [studies, setStudies] = useState<Study[]>([]);

    useEffect(() => {
        if (!patient_id) {
            return;
        }
        apiClient
            .get(API_PATHS.STUDIES_FOR_PATIENT(patient_id))
            .then((response) => {
                setStudies(response.data);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [patient_id]);

    return (
        <aside className="flex h-full min-h-0 w-full min-w-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-[10px]">
            <header className="shrink-0 border-b border-[var(--border)] px-2 py-3 sm:px-3">
                <div className="flex items-center gap-2">
                    <h1 className="min-w-0 font-semibold tracking-tight text-[var(--text)]">
                        Studies
                    </h1>
                    {
                        !isLoading && (
                            <>
                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                                    {studies.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={onOpenMetadataExplorer}
                                    title="DICOM metadata"
                                    aria-label="Open DICOM metadata explorer"
                                    className="flex ml-auto h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]/80 bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent-soft)]/50 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                                >
                                    <MetadataExplorerIcon className="size-4" />
                                </button>
                            </>
                        )
                    }
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
                {isLoading ? (
                    <div className="flex min-h-[8rem] flex-1 items-center justify-center rounded-lg border border-[var(--border)]/80 bg-[var(--surface-strong)]/50">
                        <Loading size={8} />
                    </div>
                ) : studies.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/60 px-3 py-6 text-center text-xs text-[var(--muted)]">
                        No studies for this patient.
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-0.5">
                        {studies.map((study) => (
                            <section
                                key={study.id}
                                className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]/90 shadow-sm ring-1 ring-black/[0.03]"
                            >
                                {/* Study metadata: accession + description equally prominent */}
                                <div className="grid grid-cols-1 gap-px bg-[var(--border)]/60">
                                    <div className="bg-[var(--surface-strong)] px-2 py-2">
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                                            Accession
                                        </p>
                                        <p
                                            className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-[var(--text)]"
                                            title={study.AccessionNumber || undefined}
                                        >
                                            {shortValue(study.AccessionNumber, 80)}
                                        </p>
                                    </div>
                                    <div className="bg-[var(--surface-strong)] px-2 py-2">
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                                            Study description
                                        </p>
                                        <p
                                            className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-[var(--text)]"
                                            title={study.StudyDescription || undefined}
                                        >
                                            {shortValue(study.StudyDescription, 120)}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border)]/50 p-1.5">
                                    {study.series.length === 0 ? (
                                        <p className="rounded-md bg-[var(--surface-soft)] px-2 py-2 text-center text-[11px] text-[var(--muted)]">
                                            No series in this study
                                        </p>
                                    ) : (
                                        <ul className="space-y-1">
                                            {study.series.map((studySeries) => {
                                                const active =
                                                    String(series_id) ===
                                                    String(studySeries.id);
                                                const n = instanceCount(studySeries);
                                                return (
                                                    <li key={studySeries.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onClickSeries({
                                                                    study_id: study.id,
                                                                    series_id: studySeries.id,
                                                                })
                                                            }
                                                            className={`w-full min-w-0 rounded-md border px-2 py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] ${active
                                                                ? "border-[var(--accent)] bg-[var(--accent-soft)]/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
                                                                : "border-transparent bg-[var(--surface-soft)]/80 hover:border-[var(--border)] hover:bg-[var(--accent-soft)]/35"
                                                                }`}
                                                        >
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <span className="min-w-0 shrink text-xs font-semibold text-[var(--text)]">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <span className="rounded bg-[var(--surface)] px-1 py-px text-[10px] font-bold uppercase tracking-tighter text-[var(--accent-strong)] ring-1 ring-[var(--border)]/80">
                                                                            {studySeries.Modality || "—"}
                                                                        </span>
                                                                        <span className="text-[var(--muted)]">
                                                                            #{studySeries.SeriesNumber || "—"}
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                                <span className="shrink-0 flex items-center tabular-nums text-[10px] font-medium text-[var(--muted)]">
                                                                    <span className="text-[var(--muted)]">
                                                                        {n}
                                                                    </span>
                                                                    <span>
                                                                        <StackIcon className="size-3" />
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <p
                                                                className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--muted)]"
                                                                title={
                                                                    studySeries.SeriesDescription ||
                                                                    undefined
                                                                }
                                                            >
                                                                {studySeries.SeriesDescription?.trim() ||
                                                                    "No series description"}
                                                            </p>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default SeriesPanel;
