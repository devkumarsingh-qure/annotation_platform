import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EyeIcon from "../../../../icons/EyeIcon";
//import PenIcon from "../../../icons/PenIcon";
import type { PatientDetail } from "../../../../types/Patient";
import apiClient from "../../../../utils/apiClient";
import { toastError, toastSuccess } from "../../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import { AuthContext } from "../../../../contexts/auth/authContext";
import { VIEWER_MODES } from "../../../../utils/constants";

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

function Patient() {
  const { patientId } = useParams();

  const navigate = useNavigate();
  const { user: me } = useContext(AuthContext);
  const canDelete = me?.is_workspace_admin;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!patientId) {
      const msg = "Missing patient.";
      setError(msg);
      toastError(msg);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<PatientDetail>(API_PATHS.PATIENT(patientId))
      .then((res) => {
        if (!cancelled) setPatient(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          const msg = "Patient not found or you do not have access.";
          setError(msg);
          toastError(msg);
          setPatient(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const handleDelete = async () => {
    if (!patientId || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await apiClient.delete(API_PATHS.PATIENT(patientId));
      toastSuccess("Patient deleted.");
      navigate(UI_PATHS.PATIENTS());
    } catch {
      const msg = "Could not delete patient. Try again or check permissions.";
      setDeleteError(msg);
      toastError(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!patientId) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-5 py-5 sm:px-8 sm:py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent)]"
        >
          <span className="transition group-hover:-translate-x-0.5">←</span>
          Back
        </button>

        {loading ? (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-8 max-w-md animate-pulse rounded-lg bg-[var(--surface-soft)]" />
                <div className="h-4 max-w-sm animate-pulse rounded bg-[var(--surface-soft)]" />
              </div>
            </div>
            <div className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]" />
          </div>
        ) : error || !patient ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] p-10 text-center backdrop-blur-[10px]">
            <p className="text-[var(--danger)]">
              {error ?? "Unable to load patient."}
            </p>
            <Link
              to={UI_PATHS.PATIENTS()}
              className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Back to patients
            </Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <header className="shrink-0 border-b border-[var(--border)] pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    DICOM patient
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="font-mono text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                        {patient.PatientID}
                      </h1>
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {display(patient.PatientName, "Unnamed patient")}
                      </p>
                    </div>
                  </div>
                </div>
                {canDelete ? (
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(true);
                          setDeleteError(null);
                        }}
                        className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,var(--surface))] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"
                      >
                        Delete patient
                      </button>
                    ) : (
                      <div className="flex max-w-sm flex-col gap-3 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
                        <p className="text-sm text-[var(--text)]">
                          Delete this patient and related studies, series, and
                          instances? This cannot be undone.
                        </p>
                        {deleteError ? (
                          <p
                            className="text-xs text-[var(--danger)]"
                            role="alert"
                          >
                            {deleteError}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void handleDelete()}
                            className="rounded-lg bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {deleting ? "Deleting…" : "Delete permanently"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </header>

            <section className="mt-3 shrink-0">
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border)] bg-[color:var(--surface)] p-3 backdrop-blur-[12px] sm:grid-cols-2 sm:gap-4 sm:p-3">
                <div>
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Demographics
                  </h2>
                  <dl className="mt-2 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-3 sm:gap-y-1.5">
                    <div className="sm:col-span-1">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        Patient ID
                      </dt>
                      <dd className="mt-0.5 font-mono font-medium leading-snug text-[var(--text)]">
                        {patient.PatientID}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        Sex
                      </dt>
                      <dd className="mt-0.5 leading-snug text-[var(--text)]">
                        {display(patient.PatientSex)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        Age
                      </dt>
                      <dd className="mt-0.5 leading-snug text-[var(--text)]">
                        {display(patient.PatientAge)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="border-t border-[var(--border)]/80 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Record
                  </h2>
                  <dl className="mt-2 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        Internal ID
                      </dt>
                      <dd className="mt-0.5 font-mono leading-snug text-[var(--text)]">
                        {patient.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        Created
                      </dt>
                      <dd className="mt-0.5 leading-snug text-[var(--text)]">
                        {formatDateTime(patient.created_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="mb-2 flex shrink-0 flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Studies &amp; series
                  </h2>
                  <p className="text-[11px] text-[var(--muted)]">
                    DICOM hierarchy for this patient
                  </p>
                </div>
                <p className="text-xs text-[var(--muted)] sm:text-sm">
                  <span className="font-medium text-[var(--text)]">
                    {patient.studies.length}
                  </span>{" "}
                  {patient.studies.length === 1 ? "study" : "studies"}
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] p-2 shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--border)_40%,transparent)] sm:p-2.5">
                {patient.studies.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    No studies linked to this patient yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {patient.studies.map((study) => (
                      <li
                        key={study.id}
                        className="overflow-hidden rounded-xl border border-[var(--border)] bg-[color:var(--surface)] backdrop-blur-[12px]"
                      >
                        <div className="border-b border-[var(--border)]/80 bg-[var(--surface-soft)]/50 px-4 py-4 sm:px-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--text)]">
                                {display(
                                  study.StudyDescription,
                                  "Study (no description)",
                                )}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-[var(--muted)] break-all">
                                {study.StudyInstanceUID}
                              </p>
                            </div>
                            <div className="text-right text-xs text-[var(--muted)]">
                              <p>Accession {display(study.AccessionNumber)}</p>
                              <p className="mt-1">
                                {formatDate(study.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {study.series.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-[var(--muted)] sm:px-5">
                            No series in this study.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[44rem] text-left text-sm">
                              <thead>
                                <tr className="border-b border-[var(--border)]/60 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                                  <th className="px-4 py-2 font-medium sm:px-5">
                                    Modality
                                  </th>
                                  <th className="px-4 py-2 font-medium sm:px-5">
                                    Series
                                  </th>
                                  <th className="px-4 py-2 font-medium sm:px-5">
                                    # Inst.
                                  </th>
                                  <th className="hidden px-4 py-2 font-medium sm:table-cell sm:px-5">
                                    Series UID
                                  </th>
                                  <th className="px-4 py-2 font-medium sm:px-5">
                                    Added
                                  </th>
                                  <th className="whitespace-nowrap px-4 py-2 text-right font-medium sm:px-5">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {study.series.map((s) => (
                                  <tr
                                    key={String(s.id)}
                                    className="border-b border-[var(--border)]/40 last:border-0"
                                  >
                                    <td className="px-4 py-3 align-top sm:px-5">
                                      <span className="inline-flex rounded-md bg-[var(--accent-soft)]/80 px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
                                        {display(s.Modality, "?")}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-top text-[var(--text)] sm:px-5">
                                      <span className="line-clamp-2">
                                        {display(s.SeriesDescription, "Series")}
                                      </span>
                                      {s.SeriesNumber ? (
                                        <span className="mt-1 block text-xs text-[var(--muted)]">
                                          # {s.SeriesNumber}
                                        </span>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-3 align-top font-mono text-xs text-[var(--text)] sm:px-5">
                                      {s.total_instances}
                                    </td>
                                    <td className="hidden max-w-[12rem] px-4 py-3 align-top font-mono text-[10px] text-[var(--muted)] break-all sm:table-cell sm:px-5">
                                      {s.SeriesInstanceUID}
                                    </td>
                                    <td className="px-4 py-3 align-top text-xs text-[var(--muted)] sm:px-5">
                                      {formatDate(s.created_at)}
                                    </td>
                                    <td className="px-4 py-3 align-middle sm:px-5">
                                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                                        <Link
                                          to={UI_PATHS.VIEWER({
                                            patientId,
                                            studyId: study.id,
                                            seriesId: s.id,
                                            mode: VIEWER_MODES.VIEW,
                                          })}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
                                          target="_blank"
                                        >
                                          <EyeIcon className="size-4 shrink-0" />
                                          View
                                        </Link>
                                        {/*<Link
                                                                                to={UI_PATHS.VIEWER({
                                                                                    patientId,
                                                                                    studyId: study.id,
                                                                                    seriesId: s.id,
                                                                                    mode: VIEWER_MODES.ANNOTATE,
                                                                                })}
                                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
                                                                            >
                                                                                <PenIcon className="size-4 shrink-0" />
                                                                                Annotate
                                                                            </Link>*/}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Patient;
