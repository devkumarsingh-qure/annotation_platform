import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import apiClient from "../../../utils/apiClient";
import type { Project } from "../../../types/Project";
import { toastError, toastSuccess } from "../../../utils/toast";
import { API_PATHS } from "../../../utils/urls";
import XIcon from "../../../icons/XIcon";

const fieldClass =
  "w-full min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/25 sm:min-h-11 sm:px-3.5 sm:py-2.5";

const textareaClass = `${fieldClass} grow resize-none`;

type AddProjectProps = {
  onCancel: () => void;
  onCreated: (project: Project) => void;
};

function AddProject({ onCancel, onCreated }: AddProjectProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post<Project>(API_PATHS.PROJECTS(), {
        name: name.trim(),
        description: description.trim(),
      });
      toastSuccess("Project created");
      onCreated(data);
      setName("");
      setDescription("");
    } catch (err) {
      let msg = "Could not create project";
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { detail?: unknown };
        if (typeof d.detail === "string") {
          msg = d.detail;
        } else if (
          Array.isArray(d.detail) &&
          d.detail[0] &&
          typeof d.detail[0] === "object" &&
          d.detail[0] !== null &&
          "msg" in d.detail[0]
        ) {
          msg = String((d.detail[0] as { msg: string }).msg);
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
        className="flex h-full w-full flex-col gap-4 p-3 sm:gap-6 sm:p-6"
      >
        <header className="flex shrink-0 items-start gap-3">
          <div className="min-w-0 grow space-y-2 sm:space-y-3">
            <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] sm:h-1 sm:w-10" />
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-xs sm:tracking-[0.2em]">
                Projects
              </p>
              <h2 className="text-lg font-bold tracking-tight text-[var(--text)] sm:text-xl">
                New project
              </h2>
              <p className="text-xs leading-snug text-[var(--muted)] sm:text-sm sm:leading-relaxed">
                Add a name and optional description. You can invite members
                after creation.
              </p>
            </div>
          </div>

          <div className="">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60 sm:size-11"
            >
              <XIcon className="size-5 stroke-2 sm:size-6" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 grow flex-col gap-4 pb-2 sm:gap-5">
          <div className="space-y-1 sm:space-y-1.5">
            <label
              htmlFor="project-name"
              className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Lung screening pilot"
              required
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>
          <div className="min-h-0 grow flex flex-col space-y-1 sm:space-y-1.5">
            <label
              htmlFor="project-description"
              className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaClass}
              placeholder="Goals, inclusion criteria, or notes for your team"
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 gap-3 pt-1 sm:ml-auto sm:w-auto sm:pt-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-10 w-full cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_35%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-[1.06] active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 sm:order-2 sm:min-h-11 sm:min-w-[8rem] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {isSubmitting ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProject;
