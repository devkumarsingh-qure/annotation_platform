import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EyeIcon from "../../../../icons/EyeIcon";
import type { PatientDetail } from "../../../../types/Patient";
import apiClient from "../../../../utils/apiClient";
import { toastError, toastSuccess } from "../../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import { AuthContext } from "../../../../contexts/auth/authContext";
import { display, formatDate, formatDateTime } from "../../../../utils/format";
import DetailPageLoadingShell from "../../DetailPageLoadingShell";

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
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-6">
        <Link
          to={UI_PATHS.PATIENTS()}
          className="group mb-1 inline-flex w-fit items-center gap-2 pr-4 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--accent)] sm:mb-4 sm:text-sm"
        >
          <span className="transition group-hover:-translate-x-0.5">
            ← Back to patients
          </span>
        </Link>

        {loading ? (
          <DetailPageLoadingShell />
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
            <header
              className={`shrink-0 border-b border-[var(--border)] pb-2 sm:pb-4${confirmDelete ? " relative z-40" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
                    DICOM patient
                  </p>
                  <div className="flex flex-col gap-1 sm:mt-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="truncate font-mono text-base font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                        {patient.PatientID}
                      </h1>
                      <p className="truncate text-xs text-[var(--text)] sm:mt-1 sm:text-sm">
                        {display(patient.PatientName, "Unnamed patient")}
                      </p>
                    </div>
                  </div>
                </div>
                {canDelete ? (
                  <div className="relative isolate flex min-h-8 shrink-0 flex-col items-stretch sm:min-h-[2.75rem] sm:items-end">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(true);
                          setDeleteError(null);
                        }}
                        className="min-h-8 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_70%,transparent)] px-2.5 text-xs font-medium text-[var(--muted)] transition hover:border-[color-mix(in_srgb,var(--danger)_28%,var(--border))] hover:bg-[var(--surface-soft)] hover:text-[var(--text)] sm:min-h-9 sm:self-end sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        Actions
                      </button>
                    ) : (
                      <div className="absolute right-0 top-0 z-30 flex w-[min(100vw-1.5rem,20rem)] flex-col gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-3 shadow-lg sm:gap-3 sm:p-4">
                        <p className="text-xs leading-snug text-[var(--text)] sm:text-sm">
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
                            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:opacity-50 sm:text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void handleDelete()}
                            className="grow rounded-lg bg-[var(--danger)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:text-sm"
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

            <section className="mt-1 shrink-0 sm:mt-3">
              <div className="rounded-lg border border-[var(--border)] bg-[color:var(--surface)] p-1.5 backdrop-blur-[12px] sm:hidden">
                <dl className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="min-w-0 rounded-md bg-[var(--surface-soft)]/70 px-2 py-1">
                    <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)]">
                      Sex
                    </dt>
                    <dd className="truncate font-medium leading-snug text-[var(--text)]">
                      {display(patient.PatientSex)}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-md bg-[var(--surface-soft)]/70 px-2 py-1">
                    <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)]">
                      Age
                    </dt>
                    <dd className="truncate font-medium leading-snug text-[var(--text)]">
                      {display(patient.PatientAge)}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-md bg-[var(--surface-soft)]/70 px-2 py-1">
                    <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)]">
                      Created
                    </dt>
                    <dd className="truncate font-medium leading-snug text-[var(--text)]">
                      {formatDate(patient.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)] p-2.5 backdrop-blur-[12px] sm:grid sm:grid-cols-2 sm:gap-4 sm:p-3">
                <div>
                  <h2 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[10px] sm:tracking-[0.18em]">
                    Demographics
                  </h2>
                  <dl className="mt-1.5 grid gap-x-3 gap-y-1.5 text-xs sm:mt-2 sm:grid-cols-3 sm:gap-x-4">
                    <div className="sm:col-span-1">
                      <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-[10px]">
                        Patient ID
                      </dt>
                      <dd className="mt-0.5 font-mono font-medium leading-snug text-[var(--text)]">
                        {patient.PatientID}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-[10px]">
                        Sex
                      </dt>
                      <dd className="mt-0.5 leading-snug text-[var(--text)]">
                        {display(patient.PatientSex)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-[10px]">
                        Age
                      </dt>
                      <dd className="mt-0.5 leading-snug text-[var(--text)]">
                        {display(patient.PatientAge)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="border-t border-[var(--border)]/80 pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <h2 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[10px] sm:tracking-[0.18em]">
                    Record
                  </h2>
                  <dl className="mt-1.5 grid gap-x-3 gap-y-1.5 text-xs sm:mt-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2">
                    <div>
                      <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-[10px]">
                        Internal ID
                      </dt>
                      <dd className="mt-0.5 font-mono leading-snug text-[var(--text)]">
                        {patient.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-medium uppercase tracking-wide text-[var(--muted)] sm:text-[10px]">
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

            <section className="mt-1.5 flex min-h-0 flex-1 flex-col overflow-hidden sm:mt-3">
              <div className="mb-1.5 flex shrink-0 flex-col gap-0.5 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-sm">
                    Studies {`(${patient.studies.length})`} &amp; series
                  </h2>
                  <p className="hidden text-[11px] text-[var(--muted)] sm:block">
                    DICOM hierarchy for this patient
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] p-1.5 shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--border)_40%,transparent)] sm:rounded-xl sm:p-2.5">
                {patient.studies.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    No studies linked to this patient yet.
                  </div>
                ) : (
                  <ul className="space-y-2 sm:space-y-3">
                    {patient.studies.map((study) => (
                      <li
                        key={study.id}
                        className="overflow-hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)] backdrop-blur-[12px] sm:rounded-xl"
                      >
                        <div className="border-b border-[var(--border)]/80 bg-[var(--surface-soft)]/50 px-3 py-2.5 sm:px-5 sm:py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--text)] sm:text-sm">
                                {display(
                                  study.StudyDescription,
                                  "Study (no description)",
                                )}
                              </p>
                              <p className="mt-0.5 break-all font-mono text-[10px] text-[var(--muted)] sm:mt-1 sm:text-[11px]">
                                {study.StudyInstanceUID}
                              </p>
                            </div>
                            <div className="text-left text-xs text-[var(--muted)] sm:text-right">
                              <p>Accession {display(study.AccessionNumber)}</p>
                              <p className="mt-1">
                                {formatDate(study.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {study.series.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-[var(--muted)] sm:px-5 sm:py-4 sm:text-sm">
                            No series in this study.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] text-left text-xs sm:min-w-[44rem] sm:text-sm">
                              <thead>
                                <tr className="border-b border-[var(--border)]/60 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                                  <th className="px-3 py-2 font-medium sm:px-5">
                                    Modality
                                  </th>
                                  <th className="px-3 py-2 font-medium sm:px-5">
                                    Series
                                  </th>
                                  <th className="px-3 py-2 font-medium sm:px-5">
                                    # Inst.
                                  </th>
                                  <th className="hidden px-4 py-2 font-medium sm:table-cell sm:px-5">
                                    Series UID
                                  </th>
                                  <th className="px-3 py-2 font-medium sm:px-5">
                                    Added
                                  </th>
                                  <th className="whitespace-nowrap px-3 py-2 text-right font-medium sm:px-5">
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
                                    <td className="px-3 py-2 align-top sm:px-5 sm:py-3">
                                      <span className="inline-flex rounded-md bg-[var(--accent-soft)]/80 px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
                                        {display(s.Modality, "?")}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 align-top text-[var(--text)] sm:px-5 sm:py-3">
                                      <span className="line-clamp-2">
                                        {display(s.SeriesDescription, "Series")}
                                      </span>
                                      {s.SeriesNumber ? (
                                        <span className="mt-1 block text-xs text-[var(--muted)]">
                                          # {s.SeriesNumber}
                                        </span>
                                      ) : null}
                                    </td>
                                    <td className="px-3 py-2 align-top font-mono text-xs text-[var(--text)] sm:px-5 sm:py-3">
                                      {s.total_instances}
                                    </td>
                                    <td className="hidden max-w-[12rem] px-4 py-3 align-top font-mono text-[10px] text-[var(--muted)] break-all sm:table-cell sm:px-5">
                                      {s.SeriesInstanceUID}
                                    </td>
                                    <td className="px-3 py-2 align-top text-xs text-[var(--muted)] sm:px-5 sm:py-3">
                                      {formatDate(s.created_at)}
                                    </td>
                                    <td className="px-3 py-2 align-middle sm:px-5 sm:py-3">
                                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                                        <Link
                                          to={UI_PATHS.VIEWER({
                                            patientId,
                                            studyId: study.id,
                                            seriesId: s.id,
                                          })}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 sm:px-2.5 sm:py-1.5"
                                          target="_blank"
                                        >
                                          <EyeIcon className="size-4 shrink-0" />
                                          View
                                        </Link>
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
