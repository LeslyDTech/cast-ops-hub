import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toApiQuery, type BoardFilters } from "../features/filters/filters";
import type { Category, Priority, Status } from "../lib/domain";
import { apiRequest } from "./client";
import type { Issue, IssueDetail, Location } from "./types";

// Query keys in one place, so mutations can invalidate precisely. Everything
// issue-related sits under ["issues"], so one invalidation can refresh it all.
export const queryKeys = {
  issues: ["issues"] as const,
  issueLists: ["issues", "list"] as const,
  issueList: (filters: BoardFilters) => ["issues", "list", filters] as const,
  issue: (id: number) => ["issues", "detail", id] as const,
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

export function useIssue(id: number) {
  return useQuery({
    queryKey: queryKeys.issue(id),
    queryFn: ({ signal }) => apiRequest<IssueDetail>(`/issues/${id}`, { signal }),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: ({ signal }) => apiRequest<Location[]>("/locations", { signal }),
    staleTime: 10 * 60_000, // locations rarely change
  });
}

export interface NewIssue {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  locationId: number;
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actor }: { input: NewIssue; actor: string }) =>
      apiRequest<IssueDetail>("/issues", { method: "POST", body: input, actor }),
    onSuccess: (issue) => {
      // The response is the full detail, so the panel we navigate to renders instantly.
      qc.setQueryData(queryKeys.issue(issue.id), issue);
      return qc.invalidateQueries({ queryKey: queryKeys.issueLists });
    },
  });
}

/**
 * Optimistic: the card moves columns immediately. If the server refuses (409
 * because someone else changed it first, or a network error), the board is
 * rolled back to its snapshot and the detail is refetched to show the truth.
 */
export function useChangeStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, note, actor }: { status: Status; note?: string; actor: string }) =>
      apiRequest<IssueDetail>(`/issues/${id}/status`, { method: "PATCH", body: { status, note }, actor }),

    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.issueLists });
      const snapshots = qc.getQueriesData<Issue[]>({ queryKey: queryKeys.issueLists });
      const updatedAt = new Date().toISOString();
      qc.setQueriesData<Issue[]>({ queryKey: queryKeys.issueLists }, (list) =>
        list?.map((issue) => (issue.id === id ? { ...issue, status, updatedAt } : issue)),
      );
      return { snapshots };
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      return qc.invalidateQueries({ queryKey: queryKeys.issue(id) });
    },

    onSuccess: (issue) => {
      qc.setQueryData(queryKeys.issue(id), issue);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.issueLists }),
  });
}
