import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toApiQuery, type BoardFilters } from "../features/filters/filters";
import { apiRequest } from "./client";
import type { Issue, Location } from "./types";

// Query keys in one place, so mutations can invalidate precisely.
export const queryKeys = {
  issues: ["issues"] as const,
  issueList: (filters: BoardFilters) => ["issues", "list", filters] as const,
  locations: ["locations"] as const,
};

// A wall-mounted or pocketed board should notice new issues without a reload.
const BOARD_REFRESH_MS = 30_000;

export function useIssues(filters: BoardFilters) {
  return useQuery({
    queryKey: queryKeys.issueList(filters),
    queryFn: ({ signal }) => apiRequest<Issue[]>(`/issues${toApiQuery(filters)}`, { signal }),
    // Keep showing the previous results while a new filter loads: no flash of skeletons.
    placeholderData: keepPreviousData,
    refetchInterval: BOARD_REFRESH_MS,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: ({ signal }) => apiRequest<Location[]>("/locations", { signal }),
    staleTime: 10 * 60_000, // locations rarely change
  });
}
