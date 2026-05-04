import { type FormEvent, useState } from "react";
import type { ProjectType } from "../../../types/Workspace";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import PlusIcon from "../../../icons/PlusIcon";

const fieldClass =
    "w-full min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25";

type AddProjectProps = {
    onCreated: (project: ProjectType) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function AddProject({ onCreated, open, onOpenChange }: AddProjectProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setName("");
        setDescription("");
    };

    const close = () => {
        onOpenChange(false);
        reset();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toastWarning("Project name is required.");
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await apiClient.post<ProjectType>(API_PATHS.PROJECTS(), {
                name: trimmed,
                description: description.trim(),
            });
            const project: ProjectType = {
                ...data,
                description: data.description ?? "",
            };
            onCreated(project);
            toastSuccess(`Project “${data.name}” was created.`);
            reset();
            onOpenChange(false);
        } catch {
            toastError("Could not create project. Check permissions and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) {
        return (
            <div className="shrink-0">
                <button
                    type="button"
                    onClick={() => onOpenChange(true)}
                    className="group inline-flex w-full max-w-sm items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left shadow-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 sm:max-w-none sm:min-w-[220px]"
                >
                    <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]/80 text-[var(--accent)] transition group-hover:bg-[var(--accent-soft)]"
                    >
                        <PlusIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-center text-sm font-semibold tracking-tight text-[var(--text)]">
                        New project
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex flex-1 flex-col justify-center"
            role="region"
            aria-labelledby="add-project-heading"
        >
            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-1 flex-col justify-center gap-8 sm:gap-7 "
            >
                <header className="space-y-3 border-b border-[var(--border)] pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Create
                    </p>
                    <div className="space-y-2">
                        <h2
                            id="add-project-heading"
                            className="text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl"
                        >
                            New project
                        </h2>
                        <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
                            Create a project in your workspace. This view hides the list until you finish
                            or cancel.
                        </p>
                    </div>
                </header>

                <div className="space-y-5 grow flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/80 p-4 sm:p-5">
                    <div className="space-y-2">
                        <label
                            htmlFor="project-name"
                            className="flex items-baseline justify-between gap-2 text-sm font-medium text-[var(--text)]"
                        >
                            <span>Name</span>
                            <span className="text-xs font-normal text-[var(--danger)]">Required</span>
                        </label>
                        <input
                            id="project-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={fieldClass}
                            placeholder="e.g. Lung screening Q1"
                            autoComplete="off"
                            disabled={submitting}
                        />
                    </div>
                    <div className="h-px bg-[var(--border)]" aria-hidden />
                    <div className="grow space-y-2 flex flex-col">
                        <label
                            htmlFor="project-description"
                            className="block text-sm font-medium text-[var(--text)]"
                        >
                            Description
                            <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">Optional</span>
                        </label>
                        <textarea
                            id="project-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${fieldClass} grow resize-none leading-relaxed`}
                            placeholder="Optional context for your team"
                            rows={4}
                            disabled={submitting}
                        />
                    </div>
                </div>

                <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <button
                        type="button"
                        onClick={() => close()}
                        disabled={submitting}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)] disabled:opacity-50 sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 disabled:opacity-60 sm:w-auto sm:min-w-[140px]"
                    >
                        {submitting ? "Creating…" : "Create project"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddProject;
