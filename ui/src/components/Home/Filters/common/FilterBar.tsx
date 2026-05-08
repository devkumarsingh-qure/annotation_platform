import type { ReactNode } from "react";

type FilterBarProps = {
  ariaLabel: string;
  children: ReactNode;
};

export default function FilterBar({ ariaLabel, children }: FilterBarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="rounded-lg border border-[color-mix(in_srgb,var(--border)_82%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_88%,transparent)] px-2.5 py-1.5 backdrop-blur-sm sm:px-3 sm:py-2"
    >
      <div className="flex flex-wrap items-stretch gap-x-2 gap-y-1.5 sm:items-center sm:gap-x-3 sm:gap-y-2">
        {children}
      </div>
    </section>
  );
}
