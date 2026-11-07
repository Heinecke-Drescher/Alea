import type { Token } from "./roomStore";

export const MAX_MARK_LENGTH = 40;
export const MAX_MARKS = 10;

export interface Mark {
  text: string;
}

export function isValidMark(value: unknown): value is Mark {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.length <= MAX_MARK_LENGTH
  );
}

// Other players' data may hold anything, so only valid marks are read, and only their known fields.
export function tokenMarks(token: Token): Mark[] {
  const { marks } = token;
  if (!Array.isArray(marks)) return [];
  return marks
    .filter(isValidMark)
    .slice(0, MAX_MARKS)
    .map(({ text }) => ({ text }));
}
