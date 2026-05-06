export default function DetailPageLoadingShell() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
        <div className="flex flex-1 flex-col space-y-3 pt-1">
          <div className="h-8 max-w-md animate-pulse rounded-lg bg-[var(--surface-soft)]" />
          <div className="h-4 max-w-sm animate-pulse rounded bg-[var(--surface-soft)]" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] sm:h-20"
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
