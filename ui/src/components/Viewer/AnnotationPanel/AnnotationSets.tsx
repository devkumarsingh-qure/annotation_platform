import classNames from "classnames";
import type { AnnotationSetType } from "../../../types/Viewer";
import TrashIcon from "../../../icons/TrashIcon";

function shortId(id: string | number | null | undefined, max = 12) {
    const s = String(id ?? "");
    if (s.length <= max) {
        return s;
    }
    return `${s.slice(0, max)}…`;
}

function AnnotationSets({
    annotationSets,
    handleAddNewAnnotationSetClick,
    handleAnnotationSetClick,
    handleDeleteAnnotationSet,
}: {
    annotationSets: AnnotationSetType[];
    handleAddNewAnnotationSetClick: () => void;
    handleAnnotationSetClick: (annotationSetId: string) => void;
    handleDeleteAnnotationSet: (annotationSetId: string) => void;
}) {
    const formatDate = (raw: string | number) => {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) {
            return String(raw);
        }
        return d.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="grow rounded-lg overflow-y-auto p-2">
                {
                    annotationSets.length === 0 ? (
                        <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-[var(--text)]">
                                No annotation sets yet
                            </p>
                            <p className="max-w-[16rem] text-xs leading-relaxed text-[var(--muted)]">
                                Create annotations in the viewer, then save — your sets will appear here.
                            </p>
                        </div>
                    ) : (
                        annotationSets.map((annotationSet) => {
                            const idStr = String(annotationSet.id);
                            return (
                                <div
                                    key={idStr}
                                    className="mb-2 group flex w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] shadow-sm transition hover:border-[var(--accent)]/55 hover:shadow-md has-[button:disabled]:opacity-90"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleAnnotationSetClick(idStr);
                                        }}
                                        className="min-w-0 flex-1 px-3 py-2.5 text-left transition hover:bg-[var(--accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-inset focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-[var(--text)]">
                                                Annotation set
                                            </p>
                                            <p
                                                className="mt-0.5 truncate font-mono text-[11px] text-[var(--muted)]"
                                                title={String(annotationSet.id)}
                                            >
                                                ID: {shortId(annotationSet.id, 36)}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3.5 w-3.5 shrink-0 opacity-80"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                aria-hidden
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span>{formatDate(annotationSet.created_at)}</span>
                                        </div>
                                    </button>
                                    <div className="shrink-0 self-stretch border-l border-[var(--border)]/60">
                                        <button
                                            type="button"
                                            title="Delete annotation set"
                                            aria-label="Delete annotation set"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAnnotationSet(idStr);
                                            }}
                                            className="flex h-full min-h-[2.5rem] w-9 items-center justify-center text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-red-400"
                                        >
                                            <TrashIcon
                                                className="size-4 shrink-0"
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )
                }
            </div>

            <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-soft)] p-2">
                <button
                    type="button"
                    className={classNames("flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-soft)]")}
                    onClick={() => handleAddNewAnnotationSetClick()}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0 opacity-95"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        aria-hidden
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New annotation set
                </button>
            </div>
        </div>
    );
}

export default AnnotationSets;
