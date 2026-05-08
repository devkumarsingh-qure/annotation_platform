import { useState } from "react";
import type { FormEvent } from "react";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth/authContext";

function Login() {
    const { login } = useContext(AuthContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        login(username, password);
        setUsername("");
        setPassword("");
    };

    const fieldClass =
        "w-full min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-[var(--text)] shadow-inner shadow-[color-mix(in_srgb,var(--accent)_4%,transparent)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25";

    return (
        <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden p-4 sm:p-6">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--bg-accent)_40%,transparent)] blur-3xl"
            />

            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-[22rem] space-y-8 rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] p-8 shadow-[0_24px_48px_-12px_color-mix(in_srgb,var(--text)_12%,transparent)] backdrop-blur-[14px] sm:max-w-md sm:p-9"
            >
                <header className="space-y-3 text-center">
                    <div className="mx-auto h-1 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Annotation Platform
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Welcome</h1>
                        <p className="text-sm leading-relaxed text-[var(--muted)]">
                            Sign in with your credentials to continue.
                        </p>
                    </div>
                </header>

                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="username"
                            className="block text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={fieldClass}
                            placeholder="Your username"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-left text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClass}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="submit"
                        className="w-full min-h-11 cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition hover:brightness-[1.06] active:translate-y-px active:brightness-95"
                    >
                        Sign in
                    </button>

                    <p className="text-center text-xs text-[var(--muted)]">New here?</p>

                    <button
                        type="button"
                        disabled
                        title="Coming soon"
                        className="w-full min-h-11 cursor-not-allowed rounded-lg border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)]"
                    >
                        Sign up
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;
