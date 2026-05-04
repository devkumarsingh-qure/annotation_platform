import { type FormEvent, useState } from "react";
import type { WorkspaceUser } from "../../../types/WorkspaceUser";
import apiClient from "../../../utils/apiClient";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import PlusIcon from "../../../icons/PlusIcon";
import { USER_TYPES } from "../../../utils/constants";

const fieldClass =
    "w-full min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25";

const USER_TYPE_OPTIONS = [
    { value: USER_TYPES.ANNOTATOR, label: "Annotator" },
    { value: USER_TYPES.WORKSPACE_ADMIN, label: "Workspace admin" },
] as const;

type AddUserProps = {
    onCreated: (u: WorkspaceUser) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function AddUser({ onCreated, open, onOpenChange }: AddUserProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [userType, setUserType] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setUsername("");
        setPassword("");
        setEmail("");
        setUserType("");
    };

    const close = () => {
        onOpenChange(false);
        reset();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const u = username.trim();
        if (!u) {
            toastWarning("Username is required.");
            return;
        }
        if (!password) {
            toastWarning("Password is required.");
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await apiClient.post<WorkspaceUser>(API_PATHS.USERS(), {
                username: u,
                password,
                email: email.trim(),
                user_type: userType,
            });
            onCreated(data);
            toastSuccess(`User “${data.username}” was created.`);
            reset();
            onOpenChange(false);
        } catch (err: unknown) {
            const detail =
                err &&
                typeof err === "object" &&
                "response" in err &&
                err.response &&
                typeof err.response === "object" &&
                "data" in err.response &&
                err.response.data &&
                typeof err.response.data === "object" &&
                "detail" in err.response.data
                    ? String((err.response.data as { detail: unknown }).detail)
                    : null;
            toastError(detail ?? "Could not create user. Check permissions and try again.");
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
                    className="group inline-flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left shadow-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 sm:max-w-none"
                >
                    <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]/80 text-[var(--accent)] transition group-hover:bg-[var(--accent-soft)]"
                    >
                        <PlusIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-center text-sm font-semibold tracking-tight text-[var(--text)]">
                        New user
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex flex-1 flex-col justify-center shadow-lg shadow-black/5"
            role="region"
            aria-labelledby="add-user-heading"
        >
            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-1 flex-col justify-center gap-8 sm:gap-7"
            >
                <header className="space-y-3 border-b border-[var(--border)] pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Create
                    </p>
                    <div className="space-y-2">
                        <h2
                            id="add-user-heading"
                            className="text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl"
                        >
                            New user
                        </h2>
                        <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
                            Add someone to your workspace. This view hides the list until you finish or
                            cancel.
                        </p>
                    </div>
                </header>

                <div className="flex grow flex-col space-y-5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/80 p-4 sm:p-5">
                    <div className="space-y-2">
                        <label
                            htmlFor="invite-username"
                            className="flex items-baseline justify-between gap-2 text-sm font-medium text-[var(--text)]"
                        >
                            <span>Username</span>
                            <span className="text-xs font-normal text-[var(--danger)]">Required</span>
                        </label>
                        <input
                            id="invite-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={fieldClass}
                            autoComplete="off"
                            disabled={submitting}
                        />
                    </div>

                    <div className="h-px bg-[var(--border)]" aria-hidden />

                    <div className="space-y-2">
                        <label
                            htmlFor="invite-password"
                            className="flex items-baseline justify-between gap-2 text-sm font-medium text-[var(--text)]"
                        >
                            <span>Password</span>
                            <span className="text-xs font-normal text-[var(--danger)]">Required</span>
                        </label>
                        <input
                            id="invite-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClass}
                            autoComplete="new-password"
                            disabled={submitting}
                        />
                    </div>

                    <div className="h-px bg-[var(--border)]" aria-hidden />

                    <div className="space-y-2">
                        <label
                            htmlFor="invite-email"
                            className="text-sm font-medium text-[var(--text)]"
                        >
                            Email
                            <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">Optional</span>
                        </label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={fieldClass}
                            autoComplete="off"
                            disabled={submitting}
                        />
                    </div>

                    <div className="h-px bg-[var(--border)]" aria-hidden />

                    <div className="space-y-2">
                        <label htmlFor="invite-role" className="text-sm font-medium text-[var(--text)]">
                            Role
                        </label>
                        <select
                            id="invite-role"
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            className={fieldClass}
                            disabled={submitting}
                        >
                            <option value="">Select a role</option>
                            {USER_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
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
                        {submitting ? "Creating…" : "Create user"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddUser;
