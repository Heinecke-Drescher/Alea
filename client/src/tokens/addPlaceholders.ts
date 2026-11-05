import type { MantineTheme } from "@mantine/core";
import type { Room } from "../room/createRoom";
import type { Square } from "../room/grid";
import type { PlayerColor } from "../room/playerColors";
import {
  createPlaceholderImage,
  visibleCharacters,
  type PlaceholderIcon,
} from "./placeholderImage";

export const MAX_PLACEHOLDERS = 20;

export interface Placeholders {
  name: string;
  count: number;
  color: PlayerColor;
  // Without an icon, each placeholder shows its initial and number instead, if it has them.
  icon: PlaceholderIcon | null;
}

export function placeholderNames(name: string, count: number) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PLACEHOLDERS) {
    throw new Error(`Invalid placeholder count ${count}`);
  }
  const trimmed = name.trim();
  const initial = trimmed === "" ? "" : initialOf(trimmed);
  if (count === 1) {
    return [
      { name: trimmed, label: initial === "" ? null : initial, number: null },
    ];
  }
  return Array.from({ length: count }, (_, index) => ({
    name: trimmed === "" ? `${index + 1}` : `${trimmed} ${index + 1}`,
    label: `${initial}${index + 1}`,
    number: index + 1,
  }));
}

export async function addPlaceholders(
  room: Room,
  theme: MantineTheme,
  { name, count, color, icon }: Placeholders,
  blocked: Square[],
) {
  const tokens = await Promise.all(
    placeholderNames(name, count).map(async (token) => ({
      name: token.name,
      imageDataUrl: await createPlaceholderImage(
        icon ? { icon, number: token.number } : { label: token.label },
        color,
        theme,
      ),
    })),
  );
  room.assertSpaceForImages(tokens.map((token) => token.imageDataUrl));
  room.addTokens(tokens, blocked);
}

// Some letters grow when upper-cased (ß becomes SS) and would not fit.
function initialOf(name: string) {
  const [initial] = visibleCharacters(name);
  if (!initial) throw new Error("A placeholder needs a name");
  const upper = initial.toUpperCase();
  return visibleCharacters(upper).length === 1 ? upper : initial;
}
