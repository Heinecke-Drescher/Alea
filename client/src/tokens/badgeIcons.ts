import flagSvg from "@tabler/icons/outline/flag.svg?raw";
import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import zzzSvg from "@tabler/icons/outline/zzz.svg?raw";
import type { DefaultMantineColor } from "@mantine/core";
import { IconFlag, IconSkull, IconZzz, type Icon } from "@tabler/icons-react";
import { coloredIconSvg, svgDataUrl } from "../images/iconSvg";
import type { StatusEffect } from "../room/effects";

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
  kind: StatusEffect | "mark";
  label: string;
  color: (typeof EFFECT_COLORS)[StatusEffect] | typeof MARK_COLOR;
}

// The badges of a token in the order the map and the token list show them.
export function tokenBadges(
  effects: StatusEffect[],
  mark: string | null,
): Badge[] {
  const badges: Badge[] = effects.map((effect) => ({
    kind: effect,
    label: EFFECT_LABELS[effect],
    color: EFFECT_COLORS[effect],
  }));
  if (mark !== null) {
    badges.push({
      kind: "mark",
      label: mark === "" ? MARK_LABEL : mark,
      color: MARK_COLOR,
    });
  }
  return badges;
}

export function badgeIcon(kind: Badge["kind"]): Icon {
  return kind === "mark" ? IconFlag : EFFECT_ICONS[kind];
}

export function badgeImageUrl(kind: Badge["kind"], color: string) {
  const svg = kind === "mark" ? flagSvg : EFFECT_SVGS[kind];
  return svgDataUrl(coloredIconSvg(kind, svg, color, 96));
}
