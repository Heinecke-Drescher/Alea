import flagSvg from "@tabler/icons/outline/flag.svg?raw";
import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import zzzSvg from "@tabler/icons/outline/zzz.svg?raw";
import type { DefaultMantineColor } from "@mantine/core";
import { IconFlag, IconSkull, IconZzz, type Icon } from "@tabler/icons-react";
import { coloredIconSvg, svgDataUrl } from "../images/iconSvg";
import type { StatusEffect } from "../room/effects";
import type { Mark } from "../room/marks";

export const EFFECT_LABELS: Record<StatusEffect, string> = {
  dead: "Dead",
  unconscious: "Unconscious",
};

export const EFFECT_COLORS = {
  dead: "red",
  unconscious: "violet",
} as const satisfies Record<StatusEffect, DefaultMantineColor>;

export const EFFECT_ICONS: Record<StatusEffect, Icon> = {
  dead: IconSkull,
  unconscious: IconZzz,
};

const EFFECT_SVGS: Record<StatusEffect, string> = {
  dead: skullSvg,
  unconscious: zzzSvg,
};

const MARK_LABEL = "Marked";
export const MARK_COLOR = "orange" satisfies DefaultMantineColor;

export interface Badge {
  key: string;
  kind: StatusEffect | "mark";
  label: string;
  color: (typeof EFFECT_COLORS)[StatusEffect] | typeof MARK_COLOR;
}

// The badges of a token in the order the map and the token list show them.
export function tokenBadges(effects: StatusEffect[], marks: Mark[]): Badge[] {
  return [
    ...effects.map((effect): Badge => ({
      key: effect,
      kind: effect,
      label: EFFECT_LABELS[effect],
      color: EFFECT_COLORS[effect],
    })),
    ...marks.map((mark, i): Badge => ({
      key: `mark-${i}`,
      kind: "mark",
      label: markLabel(mark),
      color: MARK_COLOR,
    })),
  ];
}

export function markLabel({ text }: Mark) {
  return text === "" ? MARK_LABEL : text;
}

// When more badges than places are there, the last place counts the hidden ones.
export function fitBadges(badges: Badge[], places: number) {
  if (badges.length <= places) return { shown: badges, hidden: [] };
  return {
    shown: badges.slice(0, places - 1),
    hidden: badges.slice(places - 1),
  };
}

export function badgeIcon(kind: Badge["kind"]): Icon {
  return kind === "mark" ? IconFlag : EFFECT_ICONS[kind];
}

export function badgeImageUrl(kind: Badge["kind"], color: string) {
  const svg = kind === "mark" ? flagSvg : EFFECT_SVGS[kind];
  return svgDataUrl(coloredIconSvg(kind, svg, color, 96));
}
