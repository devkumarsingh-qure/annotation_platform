import type { ReactNode } from "react";

type FilterBarProps = {
  ariaLabel: string;
  children: ReactNode;
};

export default function FilterBar({ ariaLabel, children }: FilterBarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="rounded-lg border border-[color-mix(in_srgb,var(--border)_82%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_88%,transparent)] px-3 py-2 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-stretch gap-x-3 gap-y-2 sm:items-center">
        {children}
      </div>
    </section>
  );
}
