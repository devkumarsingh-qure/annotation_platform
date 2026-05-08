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
    <header className="mb-3 shrink-0 border-b border-[color-mix(in_srgb,var(--border)_75%,transparent)] pb-3 sm:mb-7 sm:pb-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div className="min-w-0 space-y-1 sm:space-y-2">
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
          <div className="flex w-full justify-start sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
