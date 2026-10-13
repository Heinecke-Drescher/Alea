import { useMantineTheme } from "@mantine/core";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import type { StatusEffect } from "../room/effects";
import { CELL_SIZE } from "../room/grid";
import { EFFECT_COLORS, effectImageUrl } from "./effectIcons";
import { EFFECT_BADGE_NAME } from "./tokenNodes";

const BADGE_SIZE = 20;
const BADGE_BORDER = 1.5;
const BADGE_GAP = 2;
const ICON_SIZE = 14;

interface TokenEffectsProps {
  effects: StatusEffect[];
  tokenSize: number;
}

export function TokenEffects({ effects, tokenSize }: TokenEffectsProps) {
  return (
    <Group scaleX={tokenSize} scaleY={tokenSize}>
      {effects.map((effect, i) => (
        <EffectBadge
          key={effect}
          effect={effect}
          x={CELL_SIZE - BADGE_SIZE / 2 - i * (BADGE_SIZE + BADGE_GAP)}
          y={BADGE_SIZE / 2}
        />
      ))}
    </Group>
  );
}

interface EffectBadgeProps {
  effect: StatusEffect;
  x: number;
  y: number;
}

function EffectBadge({ effect, x, y }: EffectBadgeProps) {
  const theme = useMantineTheme();
  const [image, status] = useImage(effectImageUrl(effect, theme.white));
  if (status === "failed") {
    throw new Error(`Icon of status effect "${effect}" could not be loaded`);
  }

  return (
    <Group name={EFFECT_BADGE_NAME} effect={effect} x={x} y={y}>
      <Circle
        radius={BADGE_SIZE / 2}
        fill={theme.colors[EFFECT_COLORS[effect]][8]}
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
