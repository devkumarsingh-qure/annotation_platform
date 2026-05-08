import { useSearchParams } from "react-router-dom";
import FilterBar from "./common/FilterBar";
import FilterSelect from "./common/FilterSelect";
import {
  COMPACT_INPUT_CLASS,
  LABEL_CHIP_CLASS,
  patchParams,
} from "./common/filterPrimitives";
import { useDebouncedSearchParam } from "./common/useDebouncedSearchParam";

function UserFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const activeFromUrl = searchParams.get("active") ?? "";

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

  const hasActiveFilters =
    Boolean(searchFromUrl.trim()) ||
    activeFromUrl === "true" ||
    activeFromUrl === "false";

  const handleClear = () => {
    flushDebounceTimer();
    setSearchDraft("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("search");
      next.delete("active");
      next.set("page", "1");
      return next;
    });
  };

  return (
    <FilterBar ariaLabel="User filters">
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:min-w-[200px] sm:max-w-md sm:flex-1">
        <label htmlFor="user-filter-search" className={LABEL_CHIP_CLASS}>
          Search
        </label>
        <input
          id="user-filter-search"
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className={COMPACT_INPUT_CLASS}
          placeholder="Username or email"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <FilterSelect
        id="user-filter-active"
        label="Active"
        value={
          activeFromUrl === "true" || activeFromUrl === "false"
            ? activeFromUrl
            : ""
        }
        options={[
          { value: "", label: "Any" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ]}
        onChange={(value) =>
          syncFiltersAndResetPage({
            active: value === "true" || value === "false" ? value : null,
          })
        }
        selectWidthClass="w-[6.5rem]"
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="h-8 w-full shrink-0 cursor-pointer rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-soft)_85%,transparent)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_100%,transparent)] sm:ml-auto sm:w-auto"
        >
          Clear
        </button>
      )}
    </FilterBar>
  );
}

export default UserFilters;
