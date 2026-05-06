import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChevronDownIcon from "../../../icons/ChevronDownIcon";

/** Single-line controls: fixed height aligns text and custom chevron. */
const compactInputClass =
  "h-8 w-full min-w-0 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_90%,transparent)] px-2.5 text-[13px] leading-normal text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/55 focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25";

const labelChipClass =
  "shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]";

const SEARCH_DEBOUNCE_MS = 320;

function parseAgeRange(ageRange: string): { min: string; max: string } {
  if (!ageRange.trim()) return { min: "", max: "" };
  const comma = ageRange.indexOf(",");
  if (comma === -1) return { min: ageRange.trim(), max: "" };
  return {
    min: ageRange.slice(0, comma).trim(),
    max: ageRange.slice(comma + 1).trim(),
  };
}

function serializeAgeRange(min: string, max: string): string {
  const a = min.trim();
  const b = max.trim();
  if (!a && !b) return "";
  return `${a},${b}`;
}

function patchParams(
  params: URLSearchParams,
  patches: Record<string, string | null>,
) {
  for (const [key, val] of Object.entries(patches)) {
    if (val == null || val === "") params.delete(key);
    else params.set(key, val);
  }
}

function PatientFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const ageRangeFromUrl = searchParams.get("age_range") ?? "";
  const genderFromUrl = searchParams.get("gender") ?? "";

  const { min: minAge, max: maxAge } = useMemo(
    () => parseAgeRange(ageRangeFromUrl),
    [ageRangeFromUrl],
  );

  const [searchDraft, setSearchDraft] = useState(searchFromUrl);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      if (searchDraft === searchFromUrl) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        patchParams(next, { search: searchDraft.trim() || null });
        next.set("page", "1");
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [searchDraft, searchFromUrl, setSearchParams]);

  const syncFiltersAndResetPage = (patches: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      patchParams(next, patches);
      next.set("page", "1");
      return next;
    });
  };

  const handleAgeBlur = (
    draftMin: string,
    draftMax: string,
    currentMin: string,
    currentMax: string,
  ) => {
    if (draftMin.trim() === currentMin && draftMax.trim() === currentMax)
      return;
    syncFiltersAndResetPage({
      age_range: serializeAgeRange(draftMin, draftMax) || null,
    });
  };

  const hasActiveFilters =
    Boolean(searchFromUrl.trim()) ||
    Boolean(serializeAgeRange(minAge, maxAge)) ||
    Boolean(genderFromUrl.trim());

  const handleClear = () => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    setSearchDraft("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("search");
      next.delete("age_range");
      next.delete("gender");
      next.set("page", "1");
      return next;
    });
  };

  return (
    <section
      aria-label="Patient filters"
      className="rounded-lg border border-[color-mix(in_srgb,var(--border)_82%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_88%,transparent)] px-3 py-2 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-[200px] sm:max-w-md">
          <label htmlFor="patient-filter-search" className={labelChipClass}>
            Search
          </label>
          <input
            id="patient-filter-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className={compactInputClass}
            placeholder="ID or name"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <AgeInlineFields
          minAge={minAge}
          maxAge={maxAge}
          compactInputClass={compactInputClass}
          onCommit={handleAgeBlur}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="patient-filter-sex" className={labelChipClass}>
            Sex
          </label>
          <div className="relative">
            <select
              id="patient-filter-sex"
              value={genderFromUrl}
              onChange={(e) =>
                syncFiltersAndResetPage({
                  gender: e.target.value || null,
                })
              }
              className={`${compactInputClass} w-[5.75rem] shrink-0 cursor-pointer appearance-none pr-9`}
            >
              <option value="">Any</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="O">O</option>
            </select>
            <ChevronDownIcon
              aria-hidden
              className="pointer-events-none absolute right-2 top-1/2 size-[1.0625rem] -translate-y-1/2 text-[var(--muted)]"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="h-8 shrink-0 cursor-pointer rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_100%,transparent)]"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}

type AgeInlineFieldsProps = {
  minAge: string;
  maxAge: string;
  compactInputClass: string;
  onCommit: (
    draftMin: string,
    draftMax: string,
    currentMin: string,
    currentMax: string,
  ) => void;
};

function AgeInlineFields({
  minAge,
  maxAge,
  compactInputClass,
  onCommit,
}: AgeInlineFieldsProps) {
  const [draftMin, setDraftMin] = useState(minAge);
  const [draftMax, setDraftMax] = useState(maxAge);

  useEffect(() => {
    setDraftMin(minAge);
    setDraftMax(maxAge);
  }, [minAge, maxAge]);

  const commitBoth = () => onCommit(draftMin, draftMax, minAge, maxAge);

  return (
    <div className="flex items-center gap-2">
      <span id="patient-filter-age-desc" className={labelChipClass}>
        Age
      </span>
      <label htmlFor="patient-filter-age-min" className="sr-only">
        Minimum age
      </label>
      <input
        id="patient-filter-age-min"
        type="number"
        inputMode="numeric"
        min={0}
        aria-describedby="patient-filter-age-desc"
        value={draftMin}
        onChange={(e) => setDraftMin(e.target.value)}
        onBlur={() => commitBoth()}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={`${compactInputClass} max-w-[4rem] shrink-0 text-center`}
        placeholder="Min"
      />
      <span className="text-[var(--muted)] opacity-75" aria-hidden>
        –
      </span>
      <label htmlFor="patient-filter-age-max" className="sr-only">
        Maximum age
      </label>
      <input
        id="patient-filter-age-max"
        type="number"
        inputMode="numeric"
        min={0}
        aria-describedby="patient-filter-age-desc"
        value={draftMax}
        onChange={(e) => setDraftMax(e.target.value)}
        onBlur={() => commitBoth()}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={`${compactInputClass} max-w-[4rem] shrink-0 text-center`}
        placeholder="Max"
      />
    </div>
  );
}

export default PatientFilters;
