import type { Token } from "./roomStore";

export const MAX_MARK_LENGTH = 40;

export function isValidMark(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_MARK_LENGTH;
}

// An empty text is a mark without words; no mark at all is null.
export function tokenMark(token: Token): string | null {
  return isValidMark(token.mark) ? token.mark : null;
}
