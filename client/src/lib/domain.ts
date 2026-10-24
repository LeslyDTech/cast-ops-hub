// Mirrors server/src/issues/domain.ts. Duplicated on purpose for Phase 1: the
// client and server deploy together, and the API tests pin the contract.
export const STATUSES = ["open", "in_progress", "resolved"] as const;
export const CATEGORIES = ["equipment", "stock", "guest", "safety"] as const;
export const PRIORITIES = ["urgent", "high", "medium", "low"] as const; // most severe first

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  equipment: "Equipment",
  stock: "Stock",
  guest: "Guest",
  safety: "Safety",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** 0 = most severe. Used for sorting. */
export const priorityRank = (p: Priority) => PRIORITIES.indexOf(p);

export const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v);
export const isPriority = (v: string): v is Priority => (PRIORITIES as readonly string[]).includes(v);
