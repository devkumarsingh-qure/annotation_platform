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
    <header className="mb-4 shrink-0 border-b border-[color-mix(in_srgb,var(--border)_75%,transparent)] pb-4 sm:mb-7 sm:pb-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {eyebrow}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[color-mix(in_srgb,var(--muted)_95%,var(--text))]">
            {description}
          </p>
        </div>
        {action != null ? (
          <div className="flex w-full justify-start sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
