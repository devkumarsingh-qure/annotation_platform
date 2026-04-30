import { useEffect, useState } from "react";
import type { Patient, Study } from "../../types/Patient";
import apiClient from "../../utils/apiClient";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { Link } from "react-router-dom";
import Loading from "../Loading";
import { VIEWER_MODES } from "../../utils/constants";
import PenIcon from "../../icons/PenIcon";
import EyeIcon from "../../icons/EyeIcon";
import StackIcon from "../../icons/StackIcon";
import TrashIcon from "../../icons/TrashIcon";

function PatientDetails({
    patient,
    handleDeletePatient
}: {
    patient: Patient;
    handleDeletePatient: (patient_id: string) => void;
}) {
    const [isStudiesLoading, setIsStudiesLoading] = useState(true);
    const [studies, setStudies] = useState<Study[]>([]);

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value || "-";
        }
        return date.toLocaleString();
    };

    useEffect(() => {
        setIsStudiesLoading(true);
        apiClient
            .get(API_PATHS.STUDIES_FOR_PATIENT(patient.id))
            .then((response) => {
                setStudies(response.data);
            })
            .catch(() => {
                setStudies([]);
            })
            .finally(() => {
                setIsStudiesLoading(false);
            });
        return () => {
        };
    }, [patient.id]);

    return (
        <div className="flex h-full space-y-3 pt-3 min-h-0 w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-[10px]">
            <div className="mx-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Patient</p>
                        <h2 className="text-xl font-semibold text-[var(--text)]">{patient.PatientName || "-"}</h2>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        {patient.PatientSex || "N/A"}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                        <p className="text-xs text-[var(--muted)]">Patient ID</p>
                        <p className="font-medium text-[var(--text)]">{patient.PatientID || "-"}</p>
                    </div>
                    <div className="rounded-lg flex items-center gap-4 border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                        <div>
                            <p className="text-xs text-[var(--muted)]">Sex</p>
                            <p className="font-medium text-[var(--text)]">{patient.PatientSex || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Age</p>
                            <p className="font-medium text-[var(--text)]">{patient.PatientAge || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-3 flex items-center justify-center min-h-0 flex-1 flex-col">
                <div className="py-3 shrink-0 flex gap-2 border-t border-[var(--border)] pb-3 w-full">
                    <h3 className="text-sm font-semibold uppercase text-center tracking-wide text-[var(--muted)]">Studies{!isStudiesLoading && ` (${studies.length})`}</h3>
                </div>

                <div className="min-h-0 w-full flex-1 space-y-3 overflow-y-auto pr-1">
                    {
                        isStudiesLoading ? (
                            <div className="h-full">
                                <Loading size="lg" />
                            </div>
                        ) : (
                            studies.map((study) => {
                                return (
                                    <div key={study.id} className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface-strong)]/60 p-3">
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-10">
                                                <p className="text-xs text-[var(--muted)]">Study UID</p>
                                                <h4 className="text-sm font-medium text-[var(--text)] truncate">
                                                    {study.StudyInstanceUID}
                                                </h4>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-end">
                                                <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)]/60 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                                                    {study.series.length} series
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <div className="rounded-md border border-[var(--border)]/80 bg-[var(--surface-soft)]/70 p-2">
                                                <p className="text-xs text-[var(--muted)]">Accession Number</p>
                                                <p className="text-sm font-medium text-[var(--text)]">{study.AccessionNumber || "-"}</p>
                                            </div>
                                            <div className="rounded-md border border-[var(--border)]/80 bg-[var(--surface-soft)]/70 p-2">
                                                <p className="text-xs text-[var(--muted)]">Created At</p>
                                                <p className="text-sm font-medium text-[var(--text)]">{formatDate(study.created_at)}</p>
                                            </div>
                                            <div className="col-span-2 rounded-md border border-[var(--border)]/80 bg-[var(--surface-soft)]/70 p-2">
                                                <p className="text-xs text-[var(--muted)]">Description</p>
                                                <p className="text-sm font-medium text-[var(--text)]">{study.StudyDescription || "-"}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                                                Series
                                            </p>
                                            {study.series.length === 0 ? (
                                                <p className="text-sm text-[var(--muted)]">No series found for this study.</p>
                                            ) : (
                                                <div className="max-h-52 overflow-y-auto pr-1">
                                                    <div className="space-y-2">
                                                        {study.series.map((series) => {
                                                            return (
                                                                <div
                                                                    key={series.id}
                                                                    className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface-soft)]/70 px-3 py-2"
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="min-w-0 space-y-1">
                                                                            <p className="text-xs flex items-center font-medium text-[var(--text)]">
                                                                                {series.Modality || "N/A"} | Series {series.SeriesNumber || "-"} | {series.total_instances} <StackIcon className="ml-1 size-3 shrink-0" />
                                                                            </p>
                                                                            <p className="text-xs text-[var(--muted)]">
                                                                                Description: {series.SeriesDescription || "-"}
                                                                            </p>
                                                                            <p className="text-xs text-[var(--muted)]">
                                                                                UID: {series.SeriesInstanceUID}
                                                                            </p>
                                                                        </div>

                                                                        <div className="inline-grid shrink-0 grid-cols-2 gap-2 self-center">
                                                                            <Link
                                                                                className="block w-full min-w-0"
                                                                                to={UI_PATHS.VIEWER({ params: { patient_id: patient.id, study_id: study.id, series_id: series.id }, query: { mode: VIEWER_MODES.VIEW } })}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                            >
                                                                                <button
                                                                                    type="button"
                                                                                    className="flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 py-1 text-xs font-medium text-white transition hover:brightness-105"
                                                                                >
                                                                                    <EyeIcon className="size-3 shrink-0" />
                                                                                    <span>View</span>
                                                                                </button>
                                                                            </Link>
                                                                            <Link
                                                                                className="block w-full min-w-0"
                                                                                to={UI_PATHS.VIEWER({ params: { patient_id: patient.id, study_id: study.id, series_id: series.id }, query: { mode: VIEWER_MODES.ANNOTATE } })}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                            >
                                                                                <button
                                                                                    type="button"
                                                                                    className="flex w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 py-1 text-xs font-medium text-white transition hover:brightness-105"
                                                                                >
                                                                                    <PenIcon className="size-3 shrink-0" />
                                                                                    <span>Annotate</span>
                                                                                </button>
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )
                    }
                </div>
            </div>
            <div className="text-center shrink-0 border-t border-[var(--border)]/70 px-3 py-2">
                <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    onClick={() => {
                        handleDeletePatient(patient.id);
                    }}
                    aria-label="Delete patient"
                >
                    <TrashIcon className="size-3 shrink-0 opacity-60" />
                    <span>Delete patient</span>
                </button>
            </div>
        </div>
    );
}

export default PatientDetails;