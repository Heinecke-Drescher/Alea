import { useMantineTheme } from "@mantine/core";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import type { StatusEffect } from "../../room/effects";
import { CELL_SIZE } from "../../room/grid";
import {
  EFFECT_COLORS,
  EFFECT_LABELS,
  effectImageUrl,
  MARK_COLOR,
  MARK_LABEL,
  markImageUrl,
} from "./effectIcons";
import { BADGE_NAME } from "./tokenNodes";

const BADGE_SIZE = 20;
const BADGE_BORDER = 1.5;
const BADGE_GAP = 2;
const ICON_SIZE = 14;

interface TokenBadgesProps {
  effects: StatusEffect[];
  mark: string | null;
  tokenSize: number;
}

interface Badge {
  key: string;
  label: string;
  color: (typeof EFFECT_COLORS)[StatusEffect] | typeof MARK_COLOR;
  imageUrl: (color: string) => string;
}

export function TokenBadges({ effects, mark, tokenSize }: TokenBadgesProps) {
  const badges: Badge[] = effects.map((effect) => ({
    key: effect,
    label: EFFECT_LABELS[effect],
    color: EFFECT_COLORS[effect],
    imageUrl: (color) => effectImageUrl(effect, color),
  }));
  if (mark !== null) {
    badges.push({
      key: "mark",
      label: mark === "" ? MARK_LABEL : mark,
      color: MARK_COLOR,
      imageUrl: markImageUrl,
    });
  }

  return (
    <Group scaleX={tokenSize} scaleY={tokenSize}>
      {badges.map((badge, i) => (
        <TokenBadge
          key={badge.key}
          badge={badge}
          x={CELL_SIZE - BADGE_SIZE / 2 - i * (BADGE_SIZE + BADGE_GAP)}
          y={BADGE_SIZE / 2}
        />
      ))}
    </Group>
  );
}

interface TokenBadgeProps {
  badge: Badge;
  x: number;
  y: number;
}

function TokenBadge({ badge, x, y }: TokenBadgeProps) {
  const theme = useMantineTheme();
  const [image, status] = useImage(badge.imageUrl(theme.white));
  if (status === "failed") {
    throw new Error(`Icon of badge "${badge.key}" could not be loaded`);
  }

  return (
    <Group name={BADGE_NAME} label={badge.label} x={x} y={y}>
      <Circle
        radius={BADGE_SIZE / 2}
        fill={theme.colors[badge.color][8]}
        stroke={theme.white}
        strokeWidth={BADGE_BORDER}
      />
      <Image
        image={image}
        x={-ICON_SIZE / 2}
        y={-ICON_SIZE / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
      />
    </Group>
  );
}
