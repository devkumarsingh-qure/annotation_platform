function ProjectError({
  fetchProject,
  error,
}: {
  fetchProject: () => void;
  error: string;
}) {
  return (
    <div className="grow flex items-center justify-center">
      <div className="w-full rounded-lg border border-[var(--border)] bg-[color:var(--surface)] px-4 py-8 text-center">
        <p className="text-sm text-[var(--muted)]">{error}</p>
        <button
          type="button"
          onClick={() => fetchProject()}
          className="mt-4 min-h-9 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-xs font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_85%,var(--surface))]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default ProjectError;
