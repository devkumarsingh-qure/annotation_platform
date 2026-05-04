import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth/authContext";
import type { Patient as PatientRecord } from "../../../types/Patient";
import apiClient from "../../../utils/apiClient";
import { isWorkspaceAdmin } from "../../../utils/roleUi";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { DEFAULT_PAGE_SIZE } from "../../../utils/constants";
import Patient from "./Patient";

type PatientListResponse = {
    total_results: number;
    results: PatientRecord[];
};

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

function display(value: string | null | undefined, fallback = "—") {
    if (value == null || value === "") return fallback;
    return value;
}

function Patients() {
    const { patientId } = useParams<{ patientId: string }>();
    const { user: me } = useContext(AuthContext);

    const workspaceDirectoryBlocked =
        !patientId && !isWorkspaceAdmin(me?.user_type);

    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(
        () => Boolean(!patientId && !workspaceDirectoryBlocked),
    );

    const pageSize = DEFAULT_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

    useEffect(() => {
        if (patientId || workspaceDirectoryBlocked) return;
        let cancelled = false;
        /* eslint-disable react-hooks/set-state-in-effect -- loading flag before fetch */
        setLoading(true);
        /* eslint-enable react-hooks/set-state-in-effect */
        apiClient
            .get<PatientListResponse>(API_PATHS.PATIENTS({ page, page_size: pageSize }))
            .then((response) => {
                if (!cancelled) {
                    setPatients(response.data.results);
                    setTotalResults(response.data.total_results);
                }
            })
            .catch(() => {
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, pageSize, patientId, workspaceDirectoryBlocked]);

    if (patientId) {
        return <Patient patientId={patientId} />;
    }

    if (workspaceDirectoryBlocked) {
        return <Navigate to={UI_PATHS.PROJECTS()} replace />;
    }

    return (
        <div className="flex min-h-full flex-1 flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
            <div className="flex w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Workspace
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                            Patients
                        </h1>
                        <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                            DICOM patients available in your workspace. Open a record for demographics and
                            metadata.
                        </p>
                    </div>
                    {totalResults > 0 ? (
                        <p className="text-sm text-[var(--muted)]">
                            <span className="font-medium text-[var(--text)]">{totalResults}</span>{" "}
                            {totalResults === 1 ? "patient" : "patients"}
                        </p>
                    ) : null}
                </header>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-44 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"
                            />
                        ))}
                    </div>
                ) : patients.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--surface)] px-8 py-16 text-center backdrop-blur-[10px]">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]/80 text-2xl text-[var(--accent)]">
                            ⊕
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text)]">No patients yet</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                            Upload DICOM data or import patients through your workspace pipeline to see them
                            here.
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {patients.map((p) => (
                                <li key={p.id}>
                                    <Link
                                        to={UI_PATHS.PATIENT(p.id)}
                                        className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_12px_32px_-18px_color-mix(in_srgb,var(--text)_18%,transparent)] backdrop-blur-[12px] transition hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] hover:shadow-[0_20px_40px_-20px_color-mix(in_srgb,var(--accent)_22%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <div className="min-w-0">
                                                    <h2 className="font-mono text-sm font-semibold leading-snug text-[var(--text)] group-hover:text-[var(--accent-strong)]">
                                                        {p.PatientID}
                                                    </h2>
                                                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                                                        {display(p.PatientName, "Unnamed patient")}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[var(--muted)] opacity-0 transition group-hover:opacity-100">
                                                →
                                            </span>
                                        </div>
                                        <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)]/80 pt-4 text-xs text-[var(--muted)]">
                                            <span className="inline-flex rounded-md bg-[var(--surface-soft)] px-2 py-1 font-medium text-[var(--text)]">
                                                {display(p.PatientSex, "Sex ?")}
                                            </span>
                                            <span className="inline-flex rounded-md bg-[var(--surface-soft)] px-2 py-1 font-medium text-[var(--text)]">
                                                Age {display(p.PatientAge, "—")}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--muted)]/80">
                                            Added {formatDate(p.created_at)}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {totalPages > 1 ? (
                            <nav
                                className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6"
                                aria-label="Patient list pagination"
                            >
                                <p className="text-sm text-[var(--muted)]">
                                    Page{" "}
                                    <span className="font-medium text-[var(--text)]">{page}</span> of{" "}
                                    <span className="font-medium text-[var(--text)]">{totalPages}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </nav>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

export default Patients;
