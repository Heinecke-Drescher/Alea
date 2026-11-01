import type { IRect } from "konva/lib/types";
import type { MapImagePlace } from "../../room/mapImage";

// Lets the aligner move the drawn image while dragging, before the room has the new place.
export const MAP_IMAGE_NAME = "map-image";

function isSideways(rotation: number) {
  return rotation % 180 !== 0;
}

// Konva turns a node around its offset, so the node sits at the place's center.
export function mapImageNode({ x, y, width, height, rotation }: MapImagePlace) {
  const imageWidth = isSideways(rotation) ? height : width;
  const imageHeight = isSideways(rotation) ? width : height;
  return {
    x: x + width / 2,
    y: y + height / 2,
    width: imageWidth,
    height: imageHeight,
    offsetX: imageWidth / 2,
    offsetY: imageHeight / 2,
    rotation,
  };
}

export function placeOfNode(
  { x, y, width, height }: IRect,
  rotation: MapImagePlace["rotation"],
): MapImagePlace {
  const placeWidth = isSideways(rotation) ? height : width;
  const placeHeight = isSideways(rotation) ? width : height;
  return {
    x: x - placeWidth / 2,
    y: y - placeHeight / 2,
    width: placeWidth,
    height: placeHeight,
    rotation,
  };
}
