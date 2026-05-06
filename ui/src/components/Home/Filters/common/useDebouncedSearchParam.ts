import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateOptions } from "react-router-dom";
import {
  patchParams,
  SEARCH_DEBOUNCE_MS,
} from "./filterPrimitives";

type SetSearchParams = (
  nextInit:
    | URLSearchParams
    | Record<string, string | string[]>
    | ((prev: URLSearchParams) => URLSearchParams),
  navigateOpts?: NavigateOptions,
) => void;

/** Keeps local search draft in sync with `?search=`, debounced write to URL + reset page to 1. */
export function useDebouncedSearchParam(
  searchFromParams: string,
  setSearchParams: SetSearchParams,
  debounceMs = SEARCH_DEBOUNCE_MS,
) {
  const [searchDraft, setSearchDraft] = useState(searchFromParams);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(searchFromParams);
  }, [searchFromParams]);

  useEffect(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      if (searchDraft === searchFromParams) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        patchParams(next, { search: searchDraft.trim() || null });
        next.set("page", "1");
        return next;
      });
    }, debounceMs);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [searchDraft, searchFromParams, setSearchParams, debounceMs]);

  const flushDebounceTimer = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  return { searchDraft, setSearchDraft, flushDebounceTimer };
}
