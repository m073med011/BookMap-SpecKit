import type { LibraryStatus } from "../types";

export const VALID_TRANSITIONS: Record<LibraryStatus, LibraryStatus[]> = {
  draft: ["pending_approval"],
  pending_approval: ["active", "rejected"],
  active: ["suspended", "archived"],
  suspended: ["active", "archived"],
  rejected: ["draft"],
  archived: [],
};

export const REQUIRES_REASON: LibraryStatus[] = ["rejected", "suspended"];

export function canTransition(from: LibraryStatus, to: LibraryStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function validateTransition(from: LibraryStatus, to: LibraryStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition from '${from}' to '${to}'`);
  }
}
