import { useState } from "react";
import type { FormEvent } from "react";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthProvider";

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

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl backdrop-blur-[10px]"
            >
                <h1 className="text-center text-2xl font-semibold tracking-tight text-[var(--text)]">Login</h1>

                <div className="space-y-2">
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                        placeholder="Enter username"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                        placeholder="Enter password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full cursor-pointer rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2 font-medium text-white transition hover:brightness-105"
                >
                    Sign In
                </button>
            </form>
        </div>
    );
}

export default Login;