export const PLAYER_COLORS = [
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

export function isPlayerColor(value: unknown): value is PlayerColor {
  return PLAYER_COLORS.some((color) => color === value);
}

// Players who never picked a color still keep the same one in every room and after reloads.
export function defaultPlayerColor(name: string): PlayerColor {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const color = PLAYER_COLORS[hash % PLAYER_COLORS.length];
  if (!color) throw new Error(`No player color for "${name}"`);
  return color;
}
