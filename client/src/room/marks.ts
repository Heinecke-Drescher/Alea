import type { Token } from "./roomStore";

export const MAX_MARK_LENGTH = 40;
export const MAX_MARKS = 10;

export const MARK_ICONS = [
  "flag",
  "star",
  "heart",
  "shield",
  "sword",
  "eye",
  "flame",
  "droplet",
  "bolt",
  "target",
] as const;

export type MarkIcon = (typeof MARK_ICONS)[number];

// Without red and violet, which dead and unconscious tokens already wear.
export const MARK_COLORS = [
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "blue",
  "pink",
] as const;

export type MarkColor = (typeof MARK_COLORS)[number];

export interface Mark {
  text: string;
  icon: MarkIcon;
  color: MarkColor;
}

export const NEW_MARK: Mark = { text: "", icon: "flag", color: "orange" };

export function isValidMark(value: unknown): value is Mark {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.length <= MAX_MARK_LENGTH &&
    "icon" in value &&
    MARK_ICONS.some((icon) => icon === value.icon) &&
    "color" in value &&
    MARK_COLORS.some((color) => color === value.color)
  );
}

// Other players' data may hold anything, so only valid marks are read, and only their known fields.
export function tokenMarks(token: Token): Mark[] {
  const { marks } = token;
  if (!Array.isArray(marks)) return [];
  return marks
    .filter(isValidMark)
    .slice(0, MAX_MARKS)
    .map(({ text, icon, color }) => ({ text, icon, color }));
}
