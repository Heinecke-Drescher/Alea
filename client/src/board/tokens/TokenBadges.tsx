import { useMantineTheme } from "@mantine/core";
import { Circle, Group, Image, Text } from "react-konva";
import useImage from "use-image";
import type { StatusEffect } from "../../room/effects";
import { CELL_SIZE } from "../../room/grid";
import type { Mark } from "../../room/marks";
import {
  badgeImageUrl,
  fitBadges,
  tokenBadges,
  type Badge,
} from "../../tokens/badgeIcons";

const BADGE_SIZE = 20;
const BADGE_BORDER = 1.5;
const BADGE_GAP = 2;
const ICON_SIZE = 14;
// A third badge already reaches past a small token's left edge, so more do not fit.
const BADGE_PLACES = 3;

interface TokenBadgesProps {
  effects: StatusEffect[];
  marks: Mark[];
  tokenSize: number;
}

export function TokenBadges({ effects, marks, tokenSize }: TokenBadgesProps) {
  const { shown, hidden } = fitBadges(
    tokenBadges(effects, marks),
    BADGE_PLACES,
  );
  const placeX = (i: number) =>
    CELL_SIZE - BADGE_SIZE / 2 - i * (BADGE_SIZE + BADGE_GAP);
  return (
    <Group scaleX={tokenSize} scaleY={tokenSize}>
      {shown.map((badge, i) => (
        <TokenBadge
          key={badge.key}
          badge={badge}
          x={placeX(i)}
          y={BADGE_SIZE / 2}
        />
      ))}
      {hidden.length > 0 && (
        <HiddenBadges
          count={hidden.length}
          x={placeX(shown.length)}
          y={BADGE_SIZE / 2}
        />
      )}
    </Group>
  );
}

interface HiddenBadgesProps {
  count: number;
  x: number;
  y: number;
}

function HiddenBadges({ count, x, y }: HiddenBadgesProps) {
  const theme = useMantineTheme();
  return (
    <Group x={x} y={y}>
      <Circle
        radius={BADGE_SIZE / 2}
        fill={theme.colors.gray[8]}
        stroke={theme.white}
        strokeWidth={BADGE_BORDER}
      />
      <Text
        text={`+${count}`}
        x={-BADGE_SIZE / 2}
        y={-BADGE_SIZE / 2}
        width={BADGE_SIZE}
        height={BADGE_SIZE}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fontStyle="bold"
        fill={theme.white}
      />
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
  const [image, status] = useImage(badgeImageUrl(badge.icon, theme.white));
  if (status === "failed") {
    throw new Error(`Icon "${badge.icon}" could not be loaded`);
  }

  return (
    <Group x={x} y={y}>
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
