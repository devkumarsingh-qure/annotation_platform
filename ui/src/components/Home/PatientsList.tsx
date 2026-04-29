import classNames from "classnames";
import type { Patient } from "../../types/Patient";
import Loading from "../Loading";

function PatientsList({
    isPatientsLoading,
    patients,
    totalPatients,
    activePatient,
    handlePatientClick,
    onLoadMore,
}: {
    isPatientsLoading: boolean;
    patients: Patient[];
    totalPatients: number;
    activePatient: Patient | undefined;
    handlePatientClick: (patient: Patient) => void;
    onLoadMore: () => void;
}) {
    return (
        <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm backdrop-blur-[10px]">
            <div className="mb-3 shrink-0 rounded-lg border border-[var(--border)]/70 bg-[var(--surface-strong)]/60 p-3">
                <div className="flex items-end justify-between">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">Patients</h2>
                    {
                        !isPatientsLoading && (
                            <span className="rounded-full border border-[var(--border)]/70 bg-[var(--surface-soft)]/70 px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                                {totalPatients} total
                            </span>
                        )
                    }
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

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {
                    isPatientsLoading ? (
                        <div className="h-full">
                            <Loading />
                        </div>
                    ) : (
                        patients.length === 0 ? (
                            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
                                No patients found.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {
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
                                }
                                {patients.length < totalPatients && (
                                    <div
                                        ref={(ref) => {
                                            const observer = new IntersectionObserver(
                                                (entries) => {
                                                    if (entries[0].isIntersecting) {
                                                        onLoadMore();
                                                    }
                                                },
                                                { threshold: 0.1 }
                                            );

                                            const currentTarget = ref;
                                            if (currentTarget) {
                                                observer.observe(currentTarget);
                                            }

                                            return () => {
                                                if (currentTarget) {
                                                    observer.unobserve(currentTarget);
                                                }
                                            };

                                        }}
                                        className="h-[50px] text-xs text-[var(--muted)] flex items-center justify-center"
                                    >
                                        <Loading />
                                    </div>
                                )}
                            </div>
                        )
                    )
                }
            </div>
        </aside>
    );
}

export default PatientsList;