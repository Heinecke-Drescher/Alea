import bombSvg from "@tabler/icons/outline/bomb.svg?raw";
import bookSvg from "@tabler/icons/outline/book.svg?raw";
import coinsSvg from "@tabler/icons/outline/coins.svg?raw";
import doorSvg from "@tabler/icons/outline/door.svg?raw";
import flameSvg from "@tabler/icons/outline/flame.svg?raw";
import flaskSvg from "@tabler/icons/outline/flask.svg?raw";
import keySvg from "@tabler/icons/outline/key.svg?raw";
import lockSvg from "@tabler/icons/outline/lock.svg?raw";
import mapPinSvg from "@tabler/icons/outline/map-pin.svg?raw";
import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import stairsSvg from "@tabler/icons/outline/stairs.svg?raw";
import chestSvg from "@tabler/icons/outline/treasure-chest.svg?raw";
import { isLightColor, type MantineTheme } from "@mantine/core";
import { createImage, TOKEN_IMAGE_SIZE } from "../images/createImage";
import { coloredIconSvg } from "../images/iconSvg";
import type { PlayerColor } from "../room/playerColors";

export const PLACEHOLDER_ICONS = [
  "chest",
  "door",
  "key",
  "lock",
  "stairs",
  "flame",
  "bomb",
  "coins",
  "flask",
  "book",
  "skull",
  "pin",
] as const;

export type PlaceholderIcon = (typeof PLACEHOLDER_ICONS)[number];

const ICON_SVGS: Record<PlaceholderIcon, string> = {
  chest: chestSvg,
  door: doorSvg,
  key: keySvg,
  lock: lockSvg,
  stairs: stairsSvg,
  flame: flameSvg,
  bomb: bombSvg,
  coins: coinsSvg,
  flask: flaskSvg,
  book: bookSvg,
  skull: skullSvg,
  pin: mapPinSvg,
};

// Without a label the token is a plain disc in the player color.
export type PlaceholderContent =
  { label: string | null } | { icon: PlaceholderIcon; number: number | null };

const SIZE = 128;
const ICON_SIZE = 80;
// Long labels get smaller so they stay inside the round token.
const LABEL_FONT_SIZES = [72, 60, 46];
// The badge sits inside the round crop, so the icon shrinks towards the top left.
const NUMBERED_ICON = { size: 64, offset: 20 };
const BADGE = { center: 92, radius: 22, stroke: 3, fontSize: 26 };

export function placeholderSvg(
  content: PlaceholderContent,
  color: PlayerColor,
  theme: MantineTheme,
) {
  const fill = theme.colors[color][6];
  const ink = isLightColor(fill, theme.luminanceThreshold)
    ? theme.black
    : theme.white;
  const inner = contentSvg(content, fill, ink, theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${fill}"/>${inner}</svg>`;
}

function contentSvg(
  content: PlaceholderContent,
  fill: string,
  ink: string,
  theme: MantineTheme,
) {
  if (!("label" in content)) {
    return numberedIconSvg(content.icon, content.number, fill, ink, theme);
  }
  if (content.label === null) return "";
  return labelSvg(content.label, ink, theme.fontFamily);
}

export function createPlaceholderImage(
  content: PlaceholderContent,
  color: PlayerColor,
  theme: MantineTheme,
) {
  const svg = placeholderSvg(content, color, theme);
  const file = new File([svg], "placeholder.svg", { type: "image/svg+xml" });
  return createImage(file, TOKEN_IMAGE_SIZE);
}

function labelSvg(label: string, ink: string, fontFamily: string) {
  const fontSize = LABEL_FONT_SIZES[visibleCharacters(label).length - 1];
  if (fontSize === undefined || label.trim() === "") {
    throw new Error(`Placeholder label "${label}" must have 1 to 3 characters`);
  }
  return `<text x="${SIZE / 2}" y="${SIZE / 2}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(fontFamily)}" font-weight="700" font-size="${fontSize}" fill="${ink}">${escapeXml(label)}</text>`;
}

function numberedIconSvg(
  icon: PlaceholderIcon,
  number: number | null,
  fill: string,
  ink: string,
  theme: MantineTheme,
) {
  if (number === null) {
    return iconSvg(icon, ink, ICON_SIZE, (SIZE - ICON_SIZE) / 2);
  }
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    throw new Error(`Placeholder number ${number} must be from 1 to 99`);
  }
  const { center, radius, stroke, fontSize } = BADGE;
  return `${iconSvg(icon, ink, NUMBERED_ICON.size, NUMBERED_ICON.offset)}<circle cx="${center}" cy="${center}" r="${radius}" fill="${fill}" stroke="${ink}" stroke-width="${stroke}"/><text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(theme.fontFamily)}" font-weight="700" font-size="${fontSize}" fill="${ink}">${number}</text>`;
}

function iconSvg(
  icon: PlaceholderIcon,
  ink: string,
  size: number,
  offset: number,
) {
  const svg = coloredIconSvg(icon, ICON_SVGS[icon], ink, size);
  return `<g transform="translate(${offset} ${offset})">${svg}</g>`;
}

export function visibleCharacters(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}

function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
