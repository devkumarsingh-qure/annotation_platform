export default function DetailPageLoadingShell() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden sm:gap-8">
      <header className="shrink-0 border-b border-[var(--border)] pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
            <div className="h-0.5 w-8 animate-pulse rounded-full bg-[var(--surface-soft)] sm:h-1 sm:w-10" />
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-soft)] sm:w-24" />
            <div className="h-6 max-w-sm animate-pulse rounded-lg bg-[var(--surface-soft)] sm:h-8 sm:max-w-md" />
          </div>
          <div className="h-8 w-16 shrink-0 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] sm:h-9 sm:w-20" />
        </div>
      </header>

      <div className="shrink-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] pb-2 sm:gap-x-4 sm:pb-3">
          {[4, 5, 6, 5].map((width, index) => (
            <div key={index} className="flex items-baseline gap-1">
              <div className="h-3 w-12 animate-pulse rounded bg-[var(--surface-soft)]" />
              <div
                className="h-3 animate-pulse rounded bg-[var(--surface-soft)]"
                style={{ width: `${width}ch` }}
              />
            </div>
          ))}
        </div>
      </div>

      <section className="flex h-0 min-h-0 grow flex-col space-y-1.5 sm:space-y-2">
        <div className="h-3 w-24 shrink-0 animate-pulse rounded bg-[var(--surface-soft)] sm:h-4" />
        <div className="min-h-0 grow overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_55%,transparent)] p-2 sm:rounded-xl sm:p-3">
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--surface)_80%,var(--surface-soft))] sm:h-12"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
