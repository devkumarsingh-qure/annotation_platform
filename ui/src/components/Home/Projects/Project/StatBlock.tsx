function statBlock(label: string, value: string | number) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_70%,transparent)] px-2.5 py-2 text-center sm:px-3 sm:py-2.5 sm:text-left">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-[0.65rem]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-[var(--text)] sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function statBlockSkeleton(label: string) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_70%,transparent)] px-2.5 py-2 text-center sm:px-3 sm:py-2.5 sm:text-left">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-[0.65rem]">
        {label}
      </p>
      <div
        className="mx-auto mt-0.5 h-5 max-w-[5rem] rounded bg-[color-mix(in_srgb,var(--muted)_16%,var(--surface-soft))] motion-safe:animate-pulse sm:mx-0"
        aria-hidden
      />
    </div>
  );
}

export { statBlock, statBlockSkeleton };
