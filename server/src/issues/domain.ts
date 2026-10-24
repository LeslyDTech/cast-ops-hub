// Single source of truth for the enum-like values. The SQL CHECK constraints
// and the zod schemas both mirror these lists.
export const STATUSES = ["open", "in_progress", "resolved"] as const;
export const CATEGORIES = ["equipment", "stock", "guest", "safety"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
