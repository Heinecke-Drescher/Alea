import boltSvg from "@tabler/icons/outline/bolt.svg?raw";
import dropletSvg from "@tabler/icons/outline/droplet.svg?raw";
import eyeSvg from "@tabler/icons/outline/eye.svg?raw";
import flagSvg from "@tabler/icons/outline/flag.svg?raw";
import flameSvg from "@tabler/icons/outline/flame.svg?raw";
import heartSvg from "@tabler/icons/outline/heart.svg?raw";
import shieldSvg from "@tabler/icons/outline/shield.svg?raw";
import skullSvg from "@tabler/icons/outline/skull.svg?raw";
import starSvg from "@tabler/icons/outline/star.svg?raw";
import swordSvg from "@tabler/icons/outline/sword.svg?raw";
import targetSvg from "@tabler/icons/outline/target.svg?raw";
import zzzSvg from "@tabler/icons/outline/zzz.svg?raw";
import type { DefaultMantineColor } from "@mantine/core";
import {
  IconBolt,
  IconDroplet,
  IconEye,
  IconFlag,
  IconFlame,
  IconHeart,
  IconShield,
  IconSkull,
  IconStar,
  IconSword,
  IconTarget,
  IconZzz,
  type Icon,
} from "@tabler/icons-react";
import { coloredIconSvg, svgDataUrl } from "../images/iconSvg";
import type { StatusEffect } from "../room/effects";
import type { Mark, MarkColor, MarkIcon } from "../room/marks";

export const EFFECT_LABELS: Record<StatusEffect, string> = {
  dead: "Dead",
  unconscious: "Unconscious",
};

export const EFFECT_COLORS = {
  dead: "red",
  unconscious: "violet",
} as const satisfies Record<StatusEffect, DefaultMantineColor>;

type BadgeIconName = StatusEffect | MarkIcon;

const ICONS: Record<BadgeIconName, Icon> = {
  dead: IconSkull,
  unconscious: IconZzz,
  flag: IconFlag,
  star: IconStar,
  heart: IconHeart,
  shield: IconShield,
  sword: IconSword,
  eye: IconEye,
  flame: IconFlame,
  droplet: IconDroplet,
  bolt: IconBolt,
  target: IconTarget,
};

const SVGS: Record<BadgeIconName, string> = {
  dead: skullSvg,
  unconscious: zzzSvg,
  flag: flagSvg,
  star: starSvg,
  heart: heartSvg,
  shield: shieldSvg,
  sword: swordSvg,
  eye: eyeSvg,
  flame: flameSvg,
  droplet: dropletSvg,
  bolt: boltSvg,
  target: targetSvg,
};

export const MARK_ICON_LABELS: Record<MarkIcon, string> = {
  flag: "Flag",
  star: "Star",
  heart: "Heart",
  shield: "Shield",
  sword: "Sword",
  eye: "Eye",
  flame: "Flame",
  droplet: "Droplet",
  bolt: "Bolt",
  target: "Target",
};

export interface Badge {
  key: string;
  icon: BadgeIconName;
  label: string;
  color: (typeof EFFECT_COLORS)[StatusEffect] | MarkColor;
}

// A mark without text is told apart from the others by its icon.
export function markLabel({ text, icon }: Mark) {
  return text === "" ? MARK_ICON_LABELS[icon] : text;
}

// The badges of a token in the order the map and the token list show them.
export function tokenBadges(effects: StatusEffect[], marks: Mark[]): Badge[] {
  return [
    ...effects.map((effect): Badge => ({
      key: effect,
      icon: effect,
      label: EFFECT_LABELS[effect],
      color: EFFECT_COLORS[effect],
    })),
    ...marks.map((mark, i): Badge => ({
      key: `mark-${i}`,
      icon: mark.icon,
      label: markLabel(mark),
      color: mark.color,
    })),
  ];
}

// When more badges than places are there, the last place counts the hidden ones.
export function fitBadges(badges: Badge[], places: number) {
  if (badges.length <= places) return { shown: badges, hidden: [] };
  return {
    shown: badges.slice(0, places - 1),
    hidden: badges.slice(places - 1),
  };
}

export function badgeIcon(icon: BadgeIconName): Icon {
  return ICONS[icon];
}

export function badgeImageUrl(icon: BadgeIconName, color: string) {
  return svgDataUrl(coloredIconSvg(icon, SVGS[icon], color, 96));
}
