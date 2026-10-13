import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import zzzSvg from "@tabler/icons/outline/zzz.svg?raw";
import type { DefaultMantineColor } from "@mantine/core";
import { IconSkull, IconZzz, type Icon } from "@tabler/icons-react";
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

// Konva draws icons as images, which know no currentColor, and a larger
// intrinsic size keeps them sharp when zoomed in.
export function effectImageUrl(effect: StatusEffect, color: string) {
  const original = EFFECT_SVGS[effect];
  const expected = ['width="24"', 'height="24"', "currentColor"];
  if (!expected.every((part) => original.includes(part))) {
    throw new Error(`Icon of status effect "${effect}" has an unknown format`);
  }
  const svg = original
    .replaceAll("currentColor", color)
    .replace('width="24"', 'width="96"')
    .replace('height="24"', 'height="96"');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
