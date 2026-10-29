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

function LoadedMapImage({ image, bounds }: MapImageData) {
  const [element, status] = useImage(image);
  if (status === "failed") throw new Error("The map image could not be loaded");
  return <Image image={element} {...mapRect(bounds)} />;
}
