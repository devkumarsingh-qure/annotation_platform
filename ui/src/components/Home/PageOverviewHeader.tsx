import type { ReactNode } from "react";

type PageOverviewHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function PageOverviewHeader({
  eyebrow = "Overview",
  title,
  description,
  action,
}: PageOverviewHeaderProps) {
  return (
    <header className="mb-2 shrink-0 border-b border-[color-mix(in_srgb,var(--border)_75%,transparent)] pb-3">
      <div className="flex items-start justify-between gap-3 sm:gap-5">
        <div className="min-w-0 flex-1 space-y-1 sm:space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-xs sm:tracking-[0.22em]">
            {eyebrow}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-[var(--text)] sm:text-2xl">
            {title}
          </h2>
          <p className="max-w-2xl text-xs leading-snug text-[color-mix(in_srgb,var(--muted)_95%,var(--text))] sm:text-sm sm:leading-relaxed">
            {description}
          </p>
        </div>
        {action != null ? (
          <div className="flex shrink-0 justify-end">{action}</div>
        ) : null}
      </div>
    </header>
  );
}
