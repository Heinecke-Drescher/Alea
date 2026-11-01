import { Group, Image } from "react-konva";
import useImage from "use-image";
import { mapRect } from "../../room/grid";
import type { MapImage as MapImageData } from "../../room/mapImage";
import { useMapBounds } from "../../room/useMapBounds";
import { useMapImage } from "../../room/useMapImage";

// The image keeps its place when the map is resized, so the map edge cuts it off.
export function MapImage() {
  const mapImage = useMapImage();
  const bounds = useMapBounds();
  if (!mapImage) return null;
  return (
    <Group clip={mapRect(bounds)}>
      <LoadedMapImage {...mapImage} />
    </Group>
  );
}

function LoadedMapImage({ image, place }: MapImageData) {
  const [element, status] = useImage(image);
  if (status === "failed") throw new Error("The map image could not be loaded");
  const isSideways = place.rotation % 180 !== 0;
  const width = isSideways ? place.height : place.width;
  const height = isSideways ? place.width : place.height;
  return (
    <Image
      image={element}
      x={place.x + place.width / 2}
      y={place.y + place.height / 2}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      rotation={place.rotation}
    />
  );
}
