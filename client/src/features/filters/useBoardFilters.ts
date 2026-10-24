import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseFilters, toSearchParams, type BoardFilters } from "./filters";

/** The URL is the single source of truth for filters. */
export function useBoardFilters() {
  const [params, setParams] = useSearchParams();
  const key = params.toString();
  // Memoized on the serialized params: the same object while the URL is unchanged,
  // so the query key and child props stay referentially stable.
  const filters = useMemo(() => parseFilters(new URLSearchParams(key)), [key]);

  const setFilters = useCallback(
    (next: BoardFilters) => {
      // replace, not push: toggling chips shouldn't flood the back button.
      setParams(toSearchParams(next), { replace: true });
    },
    [setParams],
  );

  return [filters, setFilters] as const;
}
