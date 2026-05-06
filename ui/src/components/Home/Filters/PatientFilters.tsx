import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterBar from "./common/FilterBar";
import FilterSelect from "./common/FilterSelect";
import {
  COMPACT_INPUT_CLASS,
  LABEL_CHIP_CLASS,
  patchParams,
} from "./common/filterPrimitives";
import { useDebouncedSearchParam } from "./common/useDebouncedSearchParam";

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

function PatientFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const ageRangeFromUrl = searchParams.get("age_range") ?? "";
  const genderFromUrl = searchParams.get("gender") ?? "";

  const { min: minAge, max: maxAge } = useMemo(
    () => parseAgeRange(ageRangeFromUrl),
    [ageRangeFromUrl],
  );

  const { searchDraft, setSearchDraft, flushDebounceTimer } =
    useDebouncedSearchParam(searchFromUrl, setSearchParams);

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
    flushDebounceTimer();
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
    <FilterBar ariaLabel="Patient filters">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-[200px] sm:max-w-md">
        <label htmlFor="patient-filter-search" className={LABEL_CHIP_CLASS}>
          Search
        </label>
        <input
          id="patient-filter-search"
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className={COMPACT_INPUT_CLASS}
          placeholder="ID or name"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <AgeInlineFields
        minAge={minAge}
        maxAge={maxAge}
        compactInputClass={COMPACT_INPUT_CLASS}
        onCommit={handleAgeBlur}
      />

      <FilterSelect
        id="patient-filter-sex"
        label="Sex"
        value={genderFromUrl}
        options={[
          { value: "", label: "Any" },
          { value: "M", label: "M" },
          { value: "F", label: "F" },
          { value: "O", label: "O" },
        ]}
        onChange={(value) =>
          syncFiltersAndResetPage({
            gender: value || null,
          })
        }
        selectWidthClass="w-[5.75rem]"
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto h-8 shrink-0 cursor-pointer rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_100%,transparent)]"
        >
          Clear
        </button>
      )}
    </FilterBar>
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
      <span id="patient-filter-age-desc" className={LABEL_CHIP_CLASS}>
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
