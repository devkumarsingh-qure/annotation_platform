import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Patient } from "../../../types/Patient";
import type { ProjectUserDetailResponse } from "../../../types/Workspace";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import { USER_TYPES } from "../../../utils/constants";
import { useProjectDetail } from "./ProjectDetailContext";

const btnSecondary =
    "inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--text)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--accent)]/40 enabled:hover:bg-[var(--accent-soft)]/30 enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/35";
const btnPrimary =
    "inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:bg-[var(--accent-strong)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/40";
const btnDanger =
    "inline-flex min-h-8 items-center justify-center rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--danger)]/30 enabled:hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] enabled:hover:text-[var(--danger)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--danger)]/30";
const btnGhost =
    "text-[11px] font-medium text-[var(--accent)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:underline";
const linkBack =
    "self-start text-xs font-medium text-[var(--muted)] transition enabled:hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 rounded-sm";
const checkboxClass =
    "h-5 w-5 shrink-0 cursor-pointer rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/35";
const selectColumnClass =
    "relative flex w-12 min-w-[3rem] shrink-0 cursor-pointer items-center justify-center self-stretch border-r border-[var(--border)]/50 bg-[var(--surface-soft)]/40 px-2 sm:min-w-[3.25rem]";

function patientSubtitle(full: Patient | undefined) {
    if (!full) return null;
    const bits = [full.PatientSex, full.PatientAge].filter(Boolean);
    if (bits.length === 0) return null;
    return bits.join(" · ");
}

function emptySet(): Set<string> {
    return new Set();
}

function ProjectUserDetailTab() {
    const { user: me } = useContext(AuthContext);
    const navigate = useNavigate();
    const { projectId, userId } = useParams<{ projectId: string; userId: string }>();
    const { project } = useProjectDetail();

    const isWorkspaceAdmin = me?.user_type === USER_TYPES.WORKSPACE_ADMIN;
    const canManageAssignments = isWorkspaceAdmin;

    const [detail, setDetail] = useState<ProjectUserDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailError, setDetailError] = useState<string | null>(null);

    const [projectPatients, setProjectPatients] = useState<Patient[]>([]);
    const [patientDetailsById, setPatientDetailsById] = useState<Map<string, Patient>>(
        () => new Map(),
    );

    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedAssignPids, setSelectedAssignPids] = useState<Set<string>>(() => emptySet());
    const [unassignSelected, setUnassignSelected] = useState<Set<string>>(() => emptySet());
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [unassignSubmitting, setUnassignSubmitting] = useState(false);

    const loadDetail = useCallback(() => {
        if (!projectId || !userId || !canManageAssignments) return Promise.resolve();
        setDetailLoading(true);
        setDetailError(null);
        return apiClient
            .get<ProjectUserDetailResponse>(API_PATHS.PROJECT_USER(projectId, userId))
            .then((res) => setDetail(res.data))
            .catch(() => {
                setDetailError("Could not load this team member (they may not be on the project).");
                setDetail(null);
            })
            .finally(() => setDetailLoading(false));
    }, [projectId, userId, canManageAssignments]);

    useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        if (!projectId || !canManageAssignments || !project) {
            setProjectPatients([]);
            setPatientDetailsById(new Map());
            return;
        }
        let cancelled = false;
        apiClient
            .get<{ total_results: number; results: Patient[] }>(
                API_PATHS.PROJECT_PATIENTS(projectId),
                { params: { page: 1, page_size: 500 } },
            )
            .then((res) => {
                if (cancelled) return;
                setProjectPatients(res.data.results);
                const m = new Map<string, Patient>();
                for (const p of res.data.results) {
                    m.set(String(p.id), p);
                }
                setPatientDetailsById(m);
            })
            .catch(() => {
                if (!cancelled) setProjectPatients([]);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, canManageAssignments, project]);

    const assignedSorted = useMemo(() => {
        const rows = detail?.assigned_patients ?? [];
        return [...rows].sort((a, b) => a.PatientID.localeCompare(b.PatientID));
    }, [detail?.assigned_patients]);

    const assignedIds = useMemo(() => new Set(assignedSorted.map((p) => String(p.id))), [assignedSorted]);

    const pool = useMemo(
        () => projectPatients.filter((p) => !assignedIds.has(String(p.id))),
        [projectPatients, assignedIds],
    );

    const toggleAssignPid = (pid: string) => {
        setSelectedAssignPids((prev) => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    const toggleUnassignPid = (pid: string) => {
        setUnassignSelected((prev) => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    const assignPatientsBulk = async () => {
        if (!projectId || !userId || !detail || !canManageAssignments) return;
        const pids = Array.from(selectedAssignPids);
        if (pids.length === 0) return;
        setAssignSubmitting(true);
        try {
            const { data } = await apiClient.post<{
                added: { patient: { id: string; PatientID: string } }[];
                skipped: { reason?: string }[];
            }>(API_PATHS.PROJECT_USER_PATIENTS(projectId, userId), {
                patient_ids: pids,
            });
            if (!data.added.length) {
                toastError("Could not assign patients.");
                return;
            }
            await loadDetail();
            setSelectedAssignPids(emptySet());
            setPickerOpen(false);
            toastSuccess(
                `Assigned ${data.added.length} patient${data.added.length === 1 ? "" : "s"}.`,
            );
            if (data.skipped.length && data.added.length) {
                toastWarning("Some patients could not be assigned; others were assigned.");
            }
        } catch {
            toastError("Could not assign patients.");
        } finally {
            setAssignSubmitting(false);
        }
    };

    const unassignPatientsBulk = async () => {
        if (!projectId || !userId || !canManageAssignments) return;
        const pids = Array.from(unassignSelected);
        if (pids.length === 0) return;
        setUnassignSubmitting(true);
        try {
            const { data } = await apiClient.delete<{
                removed: { id: string; PatientID: string }[];
                skipped: { id?: string; reason?: string }[];
            }>(API_PATHS.PROJECT_USER_PATIENTS(projectId, userId), {
                data: { patient_ids: pids },
            });
            if (data.removed.length) {
                await loadDetail();
                setUnassignSelected(emptySet());
                toastSuccess(
                    `Removed ${data.removed.length} assignment${data.removed.length === 1 ? "" : "s"}.`,
                );
            }
            if (data.skipped.length) {
                if (data.removed.length) {
                    toastWarning(
                        "Some assignments could not be removed; others were removed.",
                    );
                } else {
                    toastError("Could not remove selected assignments.");
                }
            }
        } catch {
            toastError("Could not remove one or more assignments.");
        } finally {
            setUnassignSubmitting(false);
        }
    };

    const anyBusy = assignSubmitting || unassignSubmitting;
    const unN = unassignSelected.size;

    if (!project || !projectId || !userId) return null;

    if (!canManageAssignments) {
        return (
            <div className="px-4 py-5 sm:px-8 sm:py-6">
                <p className="text-sm text-[var(--muted)]">
                    You do not have permission to manage patient assignments.
                </p>
                <button
                    type="button"
                    onClick={() => navigate(UI_PATHS.PROJECT_USERS(projectId))}
                    className={`mt-4 ${linkBack}`}
                >
                    ← Back to team
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
            <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
                <button
                    type="button"
                    onClick={() => navigate(UI_PATHS.PROJECT_USERS(projectId))}
                    className={`mb-4 shrink-0 ${linkBack}`}
                >
                    ← Back to team
                </button>

                {detailLoading ? (
                    <p className="text-xs text-[var(--muted)]">Loading member…</p>
                ) : detailError || !detail ? (
                    <p className="text-sm text-[var(--danger)]">{detailError ?? "Not found."}</p>
                ) : (
                    <>
                        <header className="mb-6">
                            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                                {detail.user.username}
                            </h2>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                Role:{" "}
                                <span className="font-medium text-[var(--text)]">
                                    {detail.role ?? "—"}
                                </span>
                                {" · "}
                                {detail.user.user_type}
                                {detail.user.is_active ? "" : " · inactive"}
                            </p>
                            <p className="mt-2 text-[11px] text-[var(--muted)]">{detail.user.email}</p>
                        </header>

                        <section>
                            <h3 className="text-sm font-semibold text-[var(--text)]">
                                Assigned patients
                            </h3>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
                                Cases this member can open on this project. Only patients linked to the project can
                                be assigned.
                            </p>

                            {projectPatients.length === 0 ? (
                                <p className="mt-4 text-sm text-[var(--muted)]">
                                    Link patients to this project on the Patients tab, then assign them here.
                                </p>
                            ) : assignedSorted.length === 0 ? (
                                <p className="mt-4 text-xs text-[var(--muted)]">
                                    No patients assigned yet.
                                </p>
                            ) : (
                                <>
                                    <ul className="mt-4 divide-y divide-[var(--border)]/50 rounded-xl border border-[var(--border)]/60 bg-[var(--surface-soft)]/50">
                                        {assignedSorted.map((p) => {
                                            const pid = String(p.id);
                                            const uChecked = unassignSelected.has(pid);
                                            const full = patientDetailsById.get(pid);
                                            const sub = patientSubtitle(full);
                                            return (
                                                <li key={pid} className="flex items-stretch gap-0">
                                                    <label
                                                        className={selectColumnClass}
                                                        htmlFor={`unassign-${pid}`}
                                                    >
                                                        <input
                                                            id={`unassign-${pid}`}
                                                            type="checkbox"
                                                            className={checkboxClass}
                                                            checked={uChecked}
                                                            onChange={() => toggleUnassignPid(pid)}
                                                            disabled={unassignSubmitting || anyBusy}
                                                            aria-label={`Select ${p.PatientID} to unassign`}
                                                        />
                                                    </label>
                                                    <Link
                                                        to={UI_PATHS.PATIENT(pid)}
                                                        className="group flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface-soft))] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <span className="font-mono text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                                                                {p.PatientID}
                                                            </span>
                                                            {full?.PatientName ? (
                                                                <p className="truncate text-[11px] text-[var(--muted)]">
                                                                    {full.PatientName}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            {sub ? (
                                                                <span className="text-[11px] text-[var(--muted)]">
                                                                    {sub}
                                                                </span>
                                                            ) : null}
                                                            <span className="text-[10px] font-medium text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
                                                                Open →
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {unN > 0 ? (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setUnassignSelected(emptySet())}
                                                disabled={unassignSubmitting}
                                                className={btnSecondary}
                                            >
                                                Clear selection
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void unassignPatientsBulk()}
                                                disabled={unassignSubmitting}
                                                className={btnDanger}
                                            >
                                                {unassignSubmitting
                                                    ? "Removing…"
                                                    : `Confirm remove (${unN})`}
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}

                            <div className="mt-6">
                                {!pickerOpen ? (
                                    pool.length === 0 ? (
                                        <p className="text-[11px] text-[var(--muted)]">
                                            {projectPatients.length === 0
                                                ? "No patients on this project yet."
                                                : "All project patients are assigned to this user."}
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setPickerOpen(true)}
                                            className={btnSecondary}
                                            disabled={anyBusy}
                                        >
                                            Assign patients
                                        </button>
                                    )
                                ) : (
                                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-medium text-[var(--muted)]">
                                                Select project patients
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPickerOpen(false);
                                                    setSelectedAssignPids(emptySet());
                                                }}
                                                className={btnGhost}
                                                disabled={assignSubmitting}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        {pool.length === 0 ? (
                                            <p className="mt-2 text-xs text-[var(--muted)]">
                                                All project patients are already assigned to this user.
                                            </p>
                                        ) : (
                                            <>
                                                <ul className="mt-2 max-h-56 divide-y divide-[var(--border)]/40 overflow-y-auto rounded-md border border-[var(--border)]/50 bg-[color:var(--surface)]">
                                                    {[...pool]
                                                        .sort((a, b) =>
                                                            a.PatientID.localeCompare(b.PatientID),
                                                        )
                                                        .map((p) => {
                                                            const pid = String(p.id);
                                                            const checked = selectedAssignPids.has(pid);
                                                            const pFull = patientDetailsById.get(pid);
                                                            return (
                                                                <li
                                                                    key={pid}
                                                                    className="flex items-stretch"
                                                                >
                                                                    <label
                                                                        className={selectColumnClass}
                                                                        htmlFor={`assign-${pid}`}
                                                                    >
                                                                        <input
                                                                            id={`assign-${pid}`}
                                                                            type="checkbox"
                                                                            className={checkboxClass}
                                                                            checked={checked}
                                                                            onChange={() =>
                                                                                toggleAssignPid(pid)
                                                                            }
                                                                            disabled={assignSubmitting}
                                                                            aria-label={`Select ${p.PatientID}`}
                                                                        />
                                                                    </label>
                                                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pr-2 pl-2">
                                                                        <span className="font-mono text-xs font-medium text-[var(--text)]">
                                                                            {p.PatientID}
                                                                        </span>
                                                                        {pFull?.PatientName ? (
                                                                            <span className="truncate text-[10px] text-[var(--muted)]">
                                                                                {pFull.PatientName}
                                                                            </span>
                                                                        ) : null}
                                                                        <Link
                                                                            to={UI_PATHS.PATIENT(pid)}
                                                                            className="mt-1 w-fit text-[10px] font-medium text-[var(--accent)] hover:underline"
                                                                            onClick={(e) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        >
                                                                            View case
                                                                        </Link>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                </ul>
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedAssignPids(emptySet())
                                                        }
                                                        disabled={
                                                            selectedAssignPids.size === 0 ||
                                                            assignSubmitting
                                                        }
                                                        className={btnSecondary}
                                                    >
                                                        Clear selection
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void assignPatientsBulk()}
                                                        disabled={
                                                            selectedAssignPids.size === 0 ||
                                                            assignSubmitting
                                                        }
                                                        className={btnPrimary}
                                                    >
                                                        {assignSubmitting
                                                            ? "Assigning…"
                                                            : `Confirm assign (${selectedAssignPids.size})`}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProjectUserDetailTab;
