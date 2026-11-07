import { useMantineTheme } from "@mantine/core";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import type { StatusEffect } from "../../room/effects";
import { CELL_SIZE } from "../../room/grid";
import {
  badgeImageUrl,
  tokenBadges,
  type Badge,
} from "../../tokens/badgeIcons";
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

export function TokenBadges({ effects, mark, tokenSize }: TokenBadgesProps) {
  return (
    <Group scaleX={tokenSize} scaleY={tokenSize}>
      {tokenBadges(effects, mark).map((badge, i) => (
        <TokenBadge
          key={badge.kind}
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
  const [image, status] = useImage(badgeImageUrl(badge.kind, theme.white));
  if (status === "failed") {
    throw new Error(`Icon of badge "${badge.kind}" could not be loaded`);
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
