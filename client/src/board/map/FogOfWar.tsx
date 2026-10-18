import { alpha, useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { useMemo } from "react";
import { Shape } from "react-konva";
import useImage from "use-image";
import { usePlayer } from "../../player/PlayerContext";
import { foggedCells } from "../../room/fog";
import { CELL_SIZE } from "../../room/grid";
import { useFog } from "../../room/useFog";
import { fogTextureUrl } from "./fogTexture";
import { mapFillColor } from "./mapColors";

const DM_FOG_OPACITY = 0.7;
const TEXTURE_SCALE = 2;

export function FogOfWar() {
  const theme = useMantineTheme();
  const { isDm } = usePlayer();
  const cells = foggedCells(useFog());
  const colorScheme = useComputedColorScheme("light");
  // Clouds over the map's own color keep the fog's edge soft against the revealed map.
  const background = mapFillColor(theme, colorScheme);
  const cloud =
    colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[9];
  const textureUrl = useMemo(
    () => fogTextureUrl(background, cloud),
    [background, cloud],
  );
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
      fill={background}
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
