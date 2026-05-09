import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EyeIcon from "../../../../icons/EyeIcon";
import type { PatientDetail } from "../../../../types/Patient";
import apiClient from "../../../../utils/apiClient";
import { toastError, toastSuccess } from "../../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../../utils/urls";
import { AuthContext } from "../../../../contexts/auth/authContext";
import { display, formatDate } from "../../../../utils/format";
import DetailPageLoadingShell from "../../DetailPageLoadingShell";

const fieldClass =
  "w-full min-h-8 rounded-md border border-[var(--border)] bg-[color:var(--surface)] px-2 py-1 text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--accent)]/45 focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60 sm:min-h-9 sm:px-2.5 sm:py-1.5";

function Patient() {
  const { patientId } = useParams();

  const navigate = useNavigate();
  const { user: me } = useContext(AuthContext);
  const canEdit = me?.is_workspace_admin === true;
  const canDelete = canEdit;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftPatientID, setDraftPatientID] = useState("");
  const [draftPatientName, setDraftPatientName] = useState("");
  const [draftPatientAge, setDraftPatientAge] = useState("");
  const [draftPatientSex, setDraftPatientSex] = useState("");

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

  useEffect(() => {
    if (!patient) return;
    setDraftPatientID(patient.PatientID);
    setDraftPatientName(patient.PatientName ?? "");
    setDraftPatientAge(patient.PatientAge ?? "");
    setDraftPatientSex(patient.PatientSex ?? "");
    setSaveError(null);
    setIsEditing(false);
  }, [patient]);

  const isDirty =
    patient != null &&
    (draftPatientID.trim() !== patient.PatientID ||
      draftPatientName.trim() !== (patient.PatientName ?? "") ||
      draftPatientAge.trim() !== (patient.PatientAge ?? "") ||
      draftPatientSex.trim() !== (patient.PatientSex ?? ""));

  const discardEdits = () => {
    if (!patient) return;
    setDraftPatientID(patient.PatientID);
    setDraftPatientName(patient.PatientName ?? "");
    setDraftPatientAge(patient.PatientAge ?? "");
    setDraftPatientSex(patient.PatientSex ?? "");
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!patientId || !patient || saving || !canEdit) return;

    const nextPatientID = draftPatientID.trim();
    if (!nextPatientID) {
      setSaveError("Patient ID is required.");
      return;
    }

    const payload: Partial<
      Pick<
        PatientDetail,
        "PatientID" | "PatientName" | "PatientAge" | "PatientSex"
      >
    > = {};

    if (nextPatientID !== patient.PatientID) {
      payload.PatientID = nextPatientID;
    }
    if (draftPatientName.trim() !== (patient.PatientName ?? "")) {
      payload.PatientName = draftPatientName.trim();
    }
    if (draftPatientAge.trim() !== (patient.PatientAge ?? "")) {
      payload.PatientAge = draftPatientAge.trim();
    }
    if (draftPatientSex.trim() !== (patient.PatientSex ?? "")) {
      payload.PatientSex = draftPatientSex.trim();
    }

    if (Object.keys(payload).length === 0) return;

    setSaveError(null);
    setSaving(true);
    try {
      const { data } = await apiClient.patch<PatientDetail>(
        API_PATHS.PATIENT(patientId),
        payload,
      );
      setPatient(data);
      setIsEditing(false);
      toastSuccess("Patient updated.");
    } catch (err) {
      let msg = "Could not save patient changes.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") msg = d.detail;
      }
      setSaveError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

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
                        {canEdit && isEditing
                          ? draftPatientID.trim() || patient.PatientID
                          : patient.PatientID}
                      </h1>
                      <p className="truncate text-xs text-[var(--text)] sm:mt-1 sm:text-sm">
                        {canEdit && isEditing
                          ? display(draftPatientName.trim(), "Unnamed patient")
                          : display(patient.PatientName, "Unnamed patient")}
                      </p>
                    </div>
                  </div>
                </div>
                {canEdit ? (
                  <div className="relative isolate flex min-h-8 shrink-0 flex-col items-stretch sm:min-h-[2.75rem] sm:items-end">
                    {!confirmDelete ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              discardEdits();
                            } else {
                              setIsEditing(true);
                              setSaveError(null);
                            }
                          }}
                          className="min-h-8 rounded-lg border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_50%,transparent)] px-2.5 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)] sm:min-h-9 sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                          {isEditing ? "Close edit" : "Edit"}
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete(true);
                              setDeleteError(null);
                            }}
                            className="min-h-8 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-2.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-soft))] sm:min-h-9 sm:px-4 sm:py-2.5 sm:text-sm"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
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

            <section className="mt-2 shrink-0 sm:mt-3">
              <dl className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] pb-2 text-[11px] sm:gap-x-4 sm:pb-3 sm:text-xs">
                <div className="flex min-w-0 items-baseline gap-1">
                  <dt className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Sex
                  </dt>
                  <dd className="truncate font-medium text-[var(--text)]">
                    {canEdit && isEditing
                      ? display(draftPatientSex.trim())
                      : display(patient.PatientSex)}
                  </dd>
                </div>
                <div className="flex min-w-0 items-baseline gap-1">
                  <dt className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Age
                  </dt>
                  <dd className="truncate font-medium text-[var(--text)]">
                    {canEdit && isEditing
                      ? display(draftPatientAge.trim())
                      : display(patient.PatientAge)}
                  </dd>
                </div>
                <div className="flex min-w-0 items-baseline gap-1">
                  <dt className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Created
                  </dt>
                  <dd className="truncate font-medium tabular-nums text-[var(--text)]">
                    {formatDate(patient.created_at)}
                  </dd>
                </div>
                <div className="flex min-w-0 items-baseline gap-1">
                  <dt className="shrink-0 font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Studies
                  </dt>
                  <dd className="truncate font-medium tabular-nums text-[var(--text)]">
                    {patient.studies.length}
                  </dd>
                </div>
              </dl>
            </section>

            {isEditing ? (
              <section
                className="mt-1.5 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[color:var(--surface)] p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_40%,transparent)] sm:mt-2 sm:rounded-xl sm:p-3"
                aria-label="Edit patient details"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] sm:text-xs sm:tracking-[0.14em]">
                    Edit patient
                  </h2>
                  <button
                    type="button"
                    onClick={() => discardEdits()}
                    disabled={saving}
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <label
                      htmlFor="patient-id"
                      className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)]"
                    >
                      Patient ID
                    </label>
                    <input
                      id="patient-id"
                      type="text"
                      value={draftPatientID}
                      onChange={(e) => setDraftPatientID(e.target.value)}
                      disabled={saving}
                      autoComplete="off"
                      maxLength={255}
                      className={fieldClass}
                    />
                  </div>

                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <label
                      htmlFor="patient-name"
                      className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)]"
                    >
                      Name
                    </label>
                    <input
                      id="patient-name"
                      type="text"
                      value={draftPatientName}
                      onChange={(e) => setDraftPatientName(e.target.value)}
                      disabled={saving}
                      autoComplete="off"
                      maxLength={255}
                      placeholder="Optional"
                      className={fieldClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="patient-age"
                      className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)]"
                    >
                      Age
                    </label>
                    <input
                      id="patient-age"
                      type="number"
                      value={draftPatientAge}
                      onChange={(e) => setDraftPatientAge(e.target.value)}
                      disabled={saving}
                      autoComplete="off"
                      min={0}
                      max={150}
                      step={1}
                      maxLength={255}
                      placeholder="Optional"
                      className={fieldClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="patient-sex"
                      className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)]"
                  >
                    Sex
                  </label>
                    <select
                      id="patient-sex"
                      value={draftPatientSex}
                      onChange={(e) => setDraftPatientSex(e.target.value)}
                      disabled={saving}
                      className={fieldClass}
                    >
                      <option value="">Optional</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                </div>
              </section>
            ) : null}

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
                            <table className="w-full min-w-[34rem] table-fixed text-left text-xs sm:min-w-[48rem] sm:text-sm">
                              <colgroup>
                                <col className="w-[4.25rem]" />
                                <col />
                                <col className="w-[3.25rem]" />
                                <col className="hidden w-[10rem] sm:table-column" />
                                <col className="hidden w-[7.75rem] sm:table-column" />
                                <col className="w-[5.75rem]" />
                              </colgroup>
                              <thead>
                                <tr className="border-b border-[var(--border)]/60 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                                  <th className="px-2 py-2 font-medium">
                                    Modality
                                  </th>
                                  <th className="px-2 py-2 font-medium sm:px-3">
                                    Series number and description
                                  </th>
                                  <th className="whitespace-nowrap px-1.5 py-2 text-center font-medium">
                                    Inst.
                                  </th>
                                  <th className="hidden px-2 py-2 font-medium sm:table-cell sm:px-3">
                                    Series UID
                                  </th>
                                  <th className="hidden whitespace-nowrap px-2 py-2 font-medium sm:table-cell sm:px-3">
                                    Added
                                  </th>
                                  <th className="whitespace-nowrap px-2 py-2 text-right font-medium sm:px-3">
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
                                    <td className="px-2 py-2 align-middle sm:py-3">
                                      <span className="inline-flex max-w-full truncate rounded-md bg-[var(--accent-soft)]/80 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-strong)]">
                                        {display(s.Modality, "?")}
                                      </span>
                                    </td>
                                    <td className="px-2 py-2 align-middle text-[var(--text)] sm:px-3 sm:py-3">
                                      <div className="flex min-w-0 items-center overflow-hidden whitespace-nowrap">
                                        <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--muted)]">
                                          {display(s.SeriesNumber)}
                                        </span>
                                        <span className="mx-1 shrink-0 font-mono text-[var(--muted)]">
                                          #
                                        </span>
                                        <span
                                          className="min-w-0 truncate"
                                          title={display(
                                            s.SeriesDescription,
                                            "Series",
                                          )}
                                        >
                                          {display(
                                            s.SeriesDescription,
                                            "Series",
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-1.5 py-2 text-center align-middle font-mono text-xs text-[var(--text)] sm:py-3">
                                      {s.total_instances}
                                    </td>
                                    <td
                                      className="hidden truncate px-2 py-3 align-middle font-mono text-[10px] text-[var(--muted)] sm:table-cell sm:px-3"
                                      title={s.SeriesInstanceUID}
                                    >
                                      {s.SeriesInstanceUID}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-2 align-middle text-xs text-[var(--muted)] sm:table-cell sm:px-3 sm:py-3">
                                      {formatDate(s.created_at)}
                                    </td>
                                    <td className="px-2 py-2 align-middle sm:px-3 sm:py-3">
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
      {!loading && patient && !error && canEdit && isEditing && isDirty ? (
        <div
          className="shrink-0 border-t border-[color-mix(in_srgb,var(--border)_80%,transparent)] px-3 py-3 sm:px-6 sm:py-4"
          role="region"
          aria-label="Save patient changes"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {saveError ? (
              <p
                className="min-w-0 flex-1 text-xs leading-snug text-[var(--danger)] sm:text-sm"
                role="alert"
              >
                {saveError}
              </p>
            ) : (
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--muted)] sm:text-sm">
                Unsaved patient changes
              </p>
            )}
            <div className="flex shrink-0 gap-2 sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => discardEdits()}
                className="min-h-8 cursor-pointer rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:px-4"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={saving || !draftPatientID.trim()}
                onClick={() => void handleSave()}
                className="min-h-8 cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_38%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--accent-strong)_50%,transparent)] transition hover:brightness-[1.05] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:px-4"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Patient;
