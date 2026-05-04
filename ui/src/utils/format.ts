export function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const ELLIPSIS = "...";

export function truncateText(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  if (maxLen <= 0) return "";
  if (maxLen <= ELLIPSIS.length) return ELLIPSIS.slice(0, maxLen);
  return `${t.slice(0, maxLen - ELLIPSIS.length)}${ELLIPSIS}`;
}
