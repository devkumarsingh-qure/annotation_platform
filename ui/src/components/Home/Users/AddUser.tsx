import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import apiClient from "../../../utils/apiClient";
import type { User } from "../../../types/User";
import { toastError, toastSuccess } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import XIcon from "../../../icons/XIcon";

const fieldClass =
  "w-full min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25";

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
      await apiClient.post<User>(API_PATHS.USERS({ page: 0, page_size: 0 }), {
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
    <div className="flex h-full min-h-0 flex-col justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full flex-col space-y-6 p-6"
      >
        <header className="flex">
          <div className="grow space-y-3">
            <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Members
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
                New user
              </h2>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Create a workspace account. New users are members unless you
                promote them later.
              </p>
            </div>
          </div>

          <div className="">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              title="Close"
              aria-label="Close"
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XIcon className="size-6 stroke-2" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col space-y-5 overflow-y-auto pb-5">
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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

        <div className="ml-auto flex w-1/4 gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-[1.06] active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[8rem]"
          >
            {isSubmitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUser;
