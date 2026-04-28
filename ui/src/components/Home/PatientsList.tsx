import classNames from "classnames";
import type { Patient } from "../../types/Patient";

function PatientsList({
    patients,
    activePatient,
    handlePatientClick,
}: {
    patients: Patient[];
    activePatient: Patient | null;
    handlePatientClick: (patient: Patient) => void;
}) {
    return (
        <aside className="flex h-full min-h-0 w-1/3 min-w-[320px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-[10px]">
            <div className="mb-3 shrink-0 rounded-lg border border-[var(--border)]/70 bg-[var(--surface-strong)]/60 p-3">
                <div className="flex items-end justify-between">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">Patients</h2>
                    <span className="rounded-full border border-[var(--border)]/70 bg-[var(--surface-soft)]/70 px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                        {patients.length} total
                    </span>
                </div>
                <div className="mt-2">
                    <input
                        type="search"
                        placeholder="Search patients (coming soon)"
                        aria-label="Search patients placeholder"
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)] outline-none placeholder:text-[var(--muted)]/80"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2 pr-1">
                {patients.length === 0 ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
                        No patients found.
                    </div>
                ) : (
                    patients.map((patient) => (
                        <button
                            key={patient.id}
                            type="button"
                            className={classNames(
                                "w-full rounded-xl border bg-[var(--surface-strong)] p-4 text-left transition-colors",
                                "hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/60",
                                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
                                {
                                    "border-[var(--accent)] bg-[var(--accent-soft)]/65": activePatient?.id === patient.id,
                                    "border-[var(--border)]": activePatient?.id !== patient.id,
                                }
                            )}
                            onClick={() => {
                                handlePatientClick(patient);
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text)]">
                                        {patient.PatientName || "-"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">ID: {patient.PatientID || "-"}</p>
                                </div>
                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                                    {patient.PatientSex || "N/A"}
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1.5">
                                    <p className="text-[11px] text-[var(--muted)]">Age</p>
                                    <p className="text-xs font-medium text-[var(--text)]">
                                        {patient.PatientAge || "-"}
                                    </p>
                                </div>
                                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1.5">
                                    <p className="text-[11px] text-[var(--muted)]">Internal Ref</p>
                                    <p className="text-xs font-medium text-[var(--text)]">{patient.id}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </aside>
    );
}

export default PatientsList;