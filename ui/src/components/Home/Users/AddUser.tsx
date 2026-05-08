import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import apiClient from "../../../utils/apiClient";
import type { User } from "../../../types/User";
import { toastError, toastSuccess } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import XIcon from "../../../icons/XIcon";

const fieldClass =
  "w-full min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25 sm:min-h-11 sm:px-3.5 sm:py-2.5";

type AddUserProps = {
  onCancel: () => void;
  onCreated: () => void;
};

function AddUser({ onCancel, onCreated }: AddUserProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post<User>(API_PATHS.USERS(), {
        username: username.trim(),
        password,
        email: email.trim(),
      });
      toastSuccess("User created");
      onCreated();
      setUsername("");
      setPassword("");
      setEmail("");
    } catch (err) {
      let msg = "Could not create user";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") {
          msg = d.detail;
        }
      }
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full flex-col gap-4 sm:gap-6"
      >
        <header className="flex shrink-0 items-start gap-3">
          <div className="min-w-0 grow space-y-2 sm:space-y-3">
            <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] sm:h-1 sm:w-10" />
            <h2 className="text-lg font-bold tracking-tight text-[var(--text)] sm:text-xl">
              New user
            </h2>
          </div>

          <div className="">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              title="Close"
              aria-label="Close"
              className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60 sm:size-11"
            >
              <XIcon className="size-5 stroke-2 sm:size-6" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 sm:gap-5 sm:pb-5">
          <div className="space-y-1 sm:space-y-1.5">
            <label
              htmlFor="user-username"
              className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Username
            </label>
            <input
              id="user-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              placeholder="login name"
              autoComplete="off"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <label
              htmlFor="user-password"
              className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Password
            </label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <label
              htmlFor="user-email"
              className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Email <span className="font-normal lowercase">(optional)</span>
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 gap-3 pt-1 sm:ml-auto sm:w-auto sm:pt-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-10 w-full cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-[1.06] active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-11 sm:min-w-[8rem] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {isSubmitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUser;
