import { MAP_IMAGE_KEY, MAP_IMAGE_PLACE_KEY, validMapImage } from "./mapImage";
import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useMapImage() {
  const room = useRoom();
  const images = useY(room.imagesMap);
  const mapImage = useY(room.mapImageMap);
  return validMapImage(images[MAP_IMAGE_KEY], mapImage[MAP_IMAGE_PLACE_KEY]);
}
