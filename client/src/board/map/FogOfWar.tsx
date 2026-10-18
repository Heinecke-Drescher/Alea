import { alpha, useMantineTheme } from "@mantine/core";
import { useMemo } from "react";
import { Shape } from "react-konva";
import useImage from "use-image";
import { usePlayer } from "../../player/PlayerContext";
import { foggedCells } from "../../room/fog";
import { CELL_SIZE } from "../../room/grid";
import { useFog } from "../../room/useFog";
import { useMapBounds } from "../../room/useMapBounds";
import { fogTextureUrl } from "./fogTexture";

const DM_FOG_OPACITY = 0.5;
const TEXTURE_SCALE = 2;

export function FogOfWar() {
  const theme = useMantineTheme();
  const { isDm } = usePlayer();
  const { enabled, revealed } = useFog();
  const cells = foggedCells(useMapBounds(), revealed, enabled);
  const dark = theme.colors.dark[8];
  const light = theme.colors.dark[4];
  const textureUrl = useMemo(() => fogTextureUrl(dark, light), [dark, light]);
  const [texture] = useImage(textureUrl);
  if (cells.length === 0) return null;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        context.beginPath();
        for (const { x, y } of cells) {
          context.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        context.fillStrokeShape(shape);
      }}
      fill={dark}
      fillPatternImage={texture}
      fillPatternScale={{ x: TEXTURE_SCALE, y: TEXTURE_SCALE }}
      fillPriority="pattern"
      stroke={alpha(theme.colors.gray[5], 0.25)}
      strokeWidth={1}
      opacity={isDm ? DM_FOG_OPACITY : 1}
      // Players must not click or hover what they cannot see.
      listening={!isDm}
    />
  );
}
