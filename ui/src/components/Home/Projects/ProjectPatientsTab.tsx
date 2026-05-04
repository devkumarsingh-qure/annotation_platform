import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Patient } from "../../../types/Patient";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";
import { API_PATHS, UI_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import { USER_TYPES } from "../../../utils/constants";
import { useProjectDetail } from "./ProjectDetailContext";
import { patchPatientCount } from "./projectMutations";

const WORKSPACE_PATIENTS_PAGE_SIZE = 500;
const PROJECT_PATIENTS_PAGE_SIZE = 500;

function formatAddedAt(iso: string) {
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

function displayField(value: string | null | undefined, fallback = "—") {
    if (value == null || value === "") return fallback;
    return value;
}

const btnSecondary =
    "inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--text)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--accent)]/40 enabled:hover:bg-[var(--accent-soft)]/30 enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/35";
const btnPrimary =
    "inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:bg-[var(--accent-strong)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--accent)]/40";
const btnDanger =
    "inline-flex min-h-8 items-center justify-center rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 enabled:hover:border-[var(--danger)]/30 enabled:hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] enabled:hover:text-[var(--danger)] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[var(--danger)]/30";
const linkBack =
    "self-start text-xs font-medium text-[var(--muted)] transition enabled:hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 rounded-sm";
const checkboxClass =
    "h-5 w-5 shrink-0 cursor-pointer rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/35";
/** Full-row hit target for the select column (label wraps checkbox). */
const selectColumnClass =
    "relative flex w-12 min-w-[3rem] shrink-0 cursor-pointer items-center justify-center self-stretch border-r border-[var(--border)]/50 bg-[var(--surface-soft)]/40 px-2 sm:min-w-[3.25rem]";

const rowLinkClass =
    "group flex min-w-0 flex-1 items-center gap-3 px-3 py-3 transition hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] sm:gap-4 sm:px-4";

type PatientsScreen = "linked" | "add";

function newEmptyIdSet(): Set<string> {
    return new Set();
}

function ProjectPatientsTab() {
    const { user: me } = useContext(AuthContext);
    const isWorkspaceAdmin = me?.user_type === USER_TYPES.WORKSPACE_ADMIN;
    const { project, setProject, projectId, refetch } = useProjectDetail();

    const canManagePatientLinks = isWorkspaceAdmin;

    const [workspacePatients, setWorkspacePatients] = useState<Patient[]>([]);
    const [totalWorkspace, setTotalWorkspace] = useState(0);
    const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);

    const [projectPatients, setProjectPatients] = useState<Patient[]>([]);
    const [totalProjectPatients, setTotalProjectPatients] = useState(0);
    const [listError, setListError] = useState<string | null>(null);
    const [listLoading, setListLoading] = useState(true);

    const [screen, setScreen] = useState<PatientsScreen>("linked");
    const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(() => newEmptyIdSet());
    const [linkingBulk, setLinkingBulk] = useState(false);
    const [selectedUnlinkIds, setSelectedUnlinkIds] = useState<Set<string>>(() => newEmptyIdSet());
    const [unlinkingBulk, setUnlinkingBulk] = useState(false);

    const fetchProjectPatientRows = useCallback(
        (opts?: { silent?: boolean }) => {
            const silent = opts?.silent ?? false;
            setListLoading(true);
            setListError(null);
            return apiClient
                .get<{ total_results: number; results: Patient[] }>(
                    API_PATHS.PROJECT_PATIENTS(projectId),
                )
                .then((res) => {
                    setProjectPatients(res.data.results);
                    setTotalProjectPatients(res.data.total_results);
                })
                .catch(() => {
                    const msg = "Could not load patients for this project.";
                    setListError(msg);
                    if (!silent) toastError(msg);
                })
                .finally(() => {
                    setListLoading(false);
                });
        },
        [projectId],
    );

    useEffect(() => {
        void fetchProjectPatientRows({ silent: false });
    }, [fetchProjectPatientRows]);

    const reloadProjectPatientRows = useCallback(() => {
        void fetchProjectPatientRows({ silent: true });
    }, [fetchProjectPatientRows]);

    useEffect(() => {
        if (!canManagePatientLinks) {
            /* eslint-disable react-hooks/set-state-in-effect -- reset when user cannot manage links */
            setWorkspacePatients([]);
            setTotalWorkspace(0);
            setWorkspaceLoading(false);
            setWorkspaceLoadError(null);
            /* eslint-enable react-hooks/set-state-in-effect */
            return;
        }
        let cancelled = false;
        setWorkspaceLoading(true);
        setWorkspaceLoadError(null);
        apiClient
            .get<{ total_results: number; results: Patient[] }>(
                API_PATHS.PATIENTS({
                    page: 1,
                    page_size: WORKSPACE_PATIENTS_PAGE_SIZE,
                }),
            )
            .then((res) => {
                if (!cancelled) {
                    setWorkspacePatients(res.data.results);
                    setTotalWorkspace(res.data.total_results);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setWorkspaceLoadError("Could not load workspace patients.");
                }
            })
            .finally(() => {
                if (!cancelled) setWorkspaceLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [canManagePatientLinks, projectId]);

    const linkedIds = useMemo(
        () => new Set(projectPatients.map((p) => String(p.id))),
        [projectPatients],
    );

    const availableToLink = useMemo(
        () =>
            workspacePatients
                .filter((p) => !linkedIds.has(String(p.id)))
                .sort((a, b) => a.PatientID.localeCompare(b.PatientID)),
        [workspacePatients, linkedIds],
    );

    const sortedProjectRows = useMemo(
        () => [...projectPatients].sort((a, b) => a.PatientID.localeCompare(b.PatientID)),
        [projectPatients],
    );

    const toggleLinkId = (pid: string) => {
        setSelectedLinkIds((prev) => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    const linkPatientsBulk = async () => {
        if (!project || !canManagePatientLinks) return;
        const ids = Array.from(selectedLinkIds);
        if (ids.length === 0) return;
        setLinkingBulk(true);
        try {
            const { data } = await apiClient.post<{
                added: { id: string; PatientID: string }[];
                skipped: { id?: string; reason?: string }[];
            }>(API_PATHS.PROJECT_PATIENTS(projectId), { patient_ids: ids });
            if (data.added.length) {
                setProject((prev) =>
                    prev ? patchPatientCount(prev, data.added.length) : prev,
                );
                setSelectedLinkIds(newEmptyIdSet());
                setScreen("linked");
                void refetch();
                reloadProjectPatientRows();
                toastSuccess(
                    `Linked ${data.added.length} patient${data.added.length === 1 ? "" : "s"} to the project.`,
                );
            }
            if (data.skipped.length) {
                const ws = data.skipped.filter((s) => s.reason === "wrong_workspace").length;
                const msg =
                    ws > 0
                        ? "Some patients could not be linked (not in this workspace)."
                        : "Some patients could not be linked.";
                toastWarning(data.added.length ? `${msg} Others were linked.` : msg);
            } else if (!data.added.length) {
                toastError("Could not link patients to the project.");
            }
        } catch {
            toastError("Could not link patients to the project.");
        } finally {
            setLinkingBulk(false);
        }
    };

    const toggleUnlinkId = (pid: string) => {
        setSelectedUnlinkIds((prev) => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    const unlinkPatientsBulk = async () => {
        if (!project || !canManagePatientLinks || unlinkingBulk) return;
        const ids = Array.from(selectedUnlinkIds);
        if (ids.length === 0) return;
        setUnlinkingBulk(true);
        try {
            const { data } = await apiClient.delete<{
                removed: { id: string; PatientID: string }[];
                skipped: { id?: string; reason?: string }[];
            }>(API_PATHS.PROJECT_PATIENTS(projectId), { data: { patient_ids: ids } });
            if (data.removed.length) {
                setProject((prev) =>
                    prev ? patchPatientCount(prev, -data.removed.length) : prev,
                );
                setSelectedUnlinkIds(newEmptyIdSet());
                void refetch();
                reloadProjectPatientRows();
                toastSuccess(
                    `Unlinked ${data.removed.length} patient${data.removed.length === 1 ? "" : "s"} from the project.`,
                );
            }
            if (data.skipped.length) {
                if (data.removed.length) {
                    toastWarning(
                        "Some patients could not be removed from the project; others were removed.",
                    );
                } else {
                    toastError("Could not remove selected patients from the project.");
                }
            }
        } catch {
            toastError("Could not remove one or more patients from the project.");
        } finally {
            setUnlinkingBulk(false);
        }
    };

    if (!project) return null;

    const truncatedWs = totalWorkspace > WORKSPACE_PATIENTS_PAGE_SIZE;
    const truncatedProject = totalProjectPatients > PROJECT_PATIENTS_PAGE_SIZE;
    const nLink = selectedLinkIds.size;
    const nUnlink = selectedUnlinkIds.size;

    if (screen === "add") {
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
                <div className="flex w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedLinkIds(newEmptyIdSet());
                            setScreen("linked");
                        }}
                        className={`mb-4 shrink-0 ${linkBack}`}
                    >
                        ← Back to project patients
                    </button>
                    <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,var(--accent-soft))] px-4 py-4 sm:px-5">
                        <h2 className="text-sm font-semibold text-[var(--text)]">Link from workspace</h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                            Choose workspace cases to attach to this project. Removing a case from the project
                            later clears its assignments for everyone on this project.
                        </p>
                    </div>
                    {truncatedWs ? (
                        <p className="mt-3 shrink-0 text-[11px] text-[var(--muted)]">
                            Showing first {WORKSPACE_PATIENTS_PAGE_SIZE} of {totalWorkspace} workspace patients.
                        </p>
                    ) : null}
                    {workspaceLoading ? (
                        <p className="mt-6 text-xs text-[var(--muted)]">Loading workspace directory…</p>
                    ) : workspaceLoadError ? (
                        <p className="mt-6 text-sm text-[var(--danger)]">{workspaceLoadError}</p>
                    ) : availableToLink.length === 0 ? (
                        <p className="mt-6 text-sm text-[var(--muted)]">
                            Every available case is already on this project, or the directory is empty.
                        </p>
                    ) : (
                        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] shadow-sm">
                                <ul className="min-h-0 flex-1 divide-y divide-[var(--border)]/60 overflow-y-auto overscroll-contain [&>li:last-child]:border-b [&>li:last-child]:border-[var(--border)]/60">
                                    {availableToLink.map((p) => {
                                        const pid = String(p.id);
                                        const checked = selectedLinkIds.has(pid);
                                        return (
                                            <li key={pid} className="flex items-stretch">
                                                {canManagePatientLinks ? (
                                                    <label
                                                        className={selectColumnClass}
                                                        htmlFor={`link-patient-${pid}`}
                                                    >
                                                        <input
                                                            id={`link-patient-${pid}`}
                                                            type="checkbox"
                                                            className={checkboxClass}
                                                            checked={checked}
                                                            onChange={() => toggleLinkId(pid)}
                                                            disabled={linkingBulk}
                                                            aria-label={`Select ${p.PatientID}`}
                                                        />
                                                    </label>
                                                ) : null}
                                                <Link
                                                    to={UI_PATHS.PATIENT(pid)}
                                                    className={`${rowLinkClass} ${canManagePatientLinks ? "" : "pl-4"}`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-mono text-sm font-semibold text-[var(--text)]">
                                                            {p.PatientID}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--muted)]">
                                                            <span>{displayField(p.PatientName, "No name")}</span>
                                                            {p.PatientSex ? (
                                                                <span className="text-[var(--muted)]/90">
                                                                    {p.PatientSex}
                                                                </span>
                                                            ) : null}
                                                            {p.PatientAge ? (
                                                                <span className="text-[var(--muted)]/90">
                                                                    {p.PatientAge}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="shrink-0 text-[11px] font-medium text-[var(--accent)] opacity-0 transition group-hover:opacity-100"
                                                        aria-hidden
                                                    >
                                                        Open →
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            {canManagePatientLinks ? (
                                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--border)]/60 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLinkIds(newEmptyIdSet())}
                                        disabled={nLink === 0 || linkingBulk}
                                        className={btnSecondary}
                                    >
                                        Clear selection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void linkPatientsBulk()}
                                        disabled={nLink === 0 || linkingBulk}
                                        className={btnPrimary}
                                    >
                                        {linkingBulk ? "Linking…" : `Link selected (${nLink})`}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-5 sm:px-8 sm:py-6">
            <div className="flex w-full min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
                <header className="shrink-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-xl">
                            <h2 className="text-base font-semibold tracking-tight text-[var(--text)]">
                                Project patients
                            </h2>
                            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                                Cases linked to this project can be assigned to annotators on the Team tab. Open a
                                row to review studies and imaging.
                            </p>
                        </div>
                        {canManagePatientLinks ? (
                            <button type="button" onClick={() => setScreen("add")} className={btnPrimary}>
                                + Link workspace patients
                            </button>
                        ) : null}
                    </div>
                </header>

                {listLoading ? (
                    <p className="mt-8 text-xs text-[var(--muted)]">Loading patients…</p>
                ) : listError ? (
                    <p className="mt-8 text-sm text-[var(--danger)]">{listError}</p>
                ) : sortedProjectRows.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/40 px-5 py-10 text-center">
                        <p className="text-sm text-[var(--muted)]">
                            No patients on this project yet.
                        </p>
                        {canManagePatientLinks ? (
                            <button
                                type="button"
                                onClick={() => setScreen("add")}
                                className={`${btnPrimary} mt-4`}
                            >
                                Link workspace patients
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                        {truncatedProject ? (
                            <p className="shrink-0 text-[11px] text-[var(--muted)]">
                                Showing first {PROJECT_PATIENTS_PAGE_SIZE} of {totalProjectPatients} patients.
                                Contact an admin if you need a larger page size.
                            </p>
                        ) : null}
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] shadow-sm">
                            <div className="hidden shrink-0 border-b border-[var(--border)]/80 bg-[var(--surface-soft)]/80 sm:block">
                                <div
                                    className={`grid gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] ${
                                        canManagePatientLinks
                                            ? "sm:grid-cols-[3.25rem_minmax(0,1.1fr)_minmax(0,1fr)_6rem_7rem_5rem]"
                                            : "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_6rem_7rem_5rem]"
                                    }`}
                                >
                                    {canManagePatientLinks ? <span /> : null}
                                    <span>Patient ID</span>
                                    <span>Name</span>
                                    <span className="text-center">Sex / age</span>
                                    <span className="text-right">Added</span>
                                    <span className="text-right opacity-0" aria-hidden>
                                        ·
                                    </span>
                                </div>
                            </div>
                            <ul className="min-h-0 flex-1 divide-y divide-[var(--border)]/60 overflow-y-auto overscroll-contain [&>li:last-child]:border-b [&>li:last-child]:border-[var(--border)]/60">
                                {sortedProjectRows.map((p) => {
                                    const pid = String(p.id);
                                    const checked = selectedUnlinkIds.has(pid);
                                    return (
                                        <li key={pid} className="flex items-stretch">
                                            {canManagePatientLinks ? (
                                                <label
                                                    className={selectColumnClass}
                                                    htmlFor={`unlink-patient-${pid}`}
                                                >
                                                    <input
                                                        id={`unlink-patient-${pid}`}
                                                        type="checkbox"
                                                        className={checkboxClass}
                                                        checked={checked}
                                                        onChange={() => toggleUnlinkId(pid)}
                                                        disabled={unlinkingBulk}
                                                        aria-label={`Select ${p.PatientID} to remove from project`}
                                                    />
                                                </label>
                                            ) : null}
                                            <Link
                                                to={UI_PATHS.PATIENT(pid)}
                                                className={`${rowLinkClass} grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_6rem_7rem_5rem] sm:items-center sm:gap-3`}
                                            >
                                                <span className="truncate font-mono text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
                                                    {p.PatientID}
                                                </span>
                                                <span className="truncate text-xs text-[var(--muted)] sm:text-sm">
                                                    {displayField(p.PatientName, "—")}
                                                </span>
                                                <span className="text-[11px] text-[var(--muted)] sm:text-center sm:text-xs">
                                                    {[displayField(p.PatientSex, ""), displayField(p.PatientAge, "")]
                                                        .filter(Boolean)
                                                        .join(" · ") || "—"}
                                                </span>
                                                <span className="text-[11px] text-[var(--muted)] sm:text-right sm:text-xs">
                                                    {formatAddedAt(p.created_at)}
                                                </span>
                                                <span
                                                    className="text-right text-[10px] font-medium text-[var(--accent)] opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"
                                                    aria-hidden
                                                >
                                                    Open →
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        {canManagePatientLinks && nUnlink > 0 ? (
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUnlinkIds(newEmptyIdSet())}
                                    disabled={unlinkingBulk}
                                    className={btnSecondary}
                                >
                                    Clear selection
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void unlinkPatientsBulk()}
                                    disabled={unlinkingBulk}
                                    className={btnDanger}
                                >
                                    {unlinkingBulk
                                        ? "Removing…"
                                        : `Remove from project (${nUnlink})`}
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectPatientsTab;
