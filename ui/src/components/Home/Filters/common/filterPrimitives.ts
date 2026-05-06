/** Single-line controls: fixed height aligns text and custom chevron. */
export const COMPACT_INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_90%,transparent)] px-2.5 text-[13px] leading-normal text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25";

export const LABEL_CHIP_CLASS =
  "shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]";

export const SEARCH_DEBOUNCE_MS = 320;

export function patchParams(
  params: URLSearchParams,
  patches: Record<string, string | null | undefined>,
) {
  for (const [key, val] of Object.entries(patches)) {
    if (val == null || val === "") params.delete(key);
    else params.set(key, val);
  }
}
