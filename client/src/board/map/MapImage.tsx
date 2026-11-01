import { Group, Image } from "react-konva";
import useImage from "use-image";
import { mapRect } from "../../room/grid";
import type { MapImage as MapImageData } from "../../room/mapImage";
import { useMapBounds } from "../../room/useMapBounds";
import { useMapImage } from "../../room/useMapImage";
import { MAP_IMAGE_NAME, mapImageNode } from "./mapImageNode";

const OUTSIDE_OPACITY = 0.4;

interface MapImageProps {
  // While aligning, the parts beyond the map edge show what will be cut off.
  showsOutside: boolean;
}

// The image keeps its place when the map is resized, so the map edge cuts it off.
export function MapImage({ showsOutside }: MapImageProps) {
  const mapImage = useMapImage();
  const bounds = useMapBounds();
  if (!mapImage) return null;
  return (
    <>
      {showsOutside && (
        <LoadedMapImage {...mapImage} opacity={OUTSIDE_OPACITY} />
      )}
      <Group clip={mapRect(bounds)}>
        <LoadedMapImage {...mapImage} opacity={1} />
      </Group>
    </>
  );
}

function LoadedMapImage({
  image,
  place,
  opacity,
}: MapImageData & { opacity: number }) {
  const [element, status] = useImage(image);
  if (status === "failed") throw new Error("The map image could not be loaded");
  return (
    <Image
      name={MAP_IMAGE_NAME}
      image={element}
      opacity={opacity}
      {...mapImageNode(place)}
    />
  );
}
