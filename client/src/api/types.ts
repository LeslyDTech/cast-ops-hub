import type { Category, Priority, Status } from "../lib/domain";

// Response shapes of the server API. Dates arrive as ISO strings over JSON.
export interface Issue {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  locationId: number;
  locationName: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueEvent {
  id: number;
  fromStatus: Status | null;
  toStatus: Status;
  note: string | null;
  changedBy: string;
  createdAt: string;
}

export interface IssueDetail extends Issue {
  events: IssueEvent[];
  allowedTransitions: Status[];
}

export interface Location {
  id: number;
  name: string;
  area: string;
}
