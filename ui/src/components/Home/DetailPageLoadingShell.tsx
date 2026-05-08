export default function DetailPageLoadingShell() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-3 sm:gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-[var(--surface-soft)] sm:h-16 sm:w-16 sm:rounded-2xl" />
        <div className="flex flex-1 flex-col space-y-2 pt-1 sm:space-y-3">
          <div className="h-6 max-w-md animate-pulse rounded-lg bg-[var(--surface-soft)] sm:h-8" />
          <div className="h-3 max-w-sm animate-pulse rounded bg-[var(--surface-soft)] sm:h-4" />
        </div>
      </div>
      <div className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] sm:h-40" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] sm:h-20 sm:rounded-xl"
          />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-soft)]" />
        <div className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] sm:h-40" />
      </div>
    </div>
  );
}
