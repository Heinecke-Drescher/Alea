import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import zzzSvg from "@tabler/icons/outline/zzz.svg?raw";
import type { DefaultMantineColor } from "@mantine/core";
import { IconSkull, IconZzz, type Icon } from "@tabler/icons-react";
import { coloredIconSvg, svgDataUrl } from "../../images/iconSvg";
import type { StatusEffect } from "../../room/effects";

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

export function effectImageUrl(effect: StatusEffect, color: string) {
  return svgDataUrl(coloredIconSvg(effect, EFFECT_SVGS[effect], color, 96));
}
