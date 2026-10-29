import { MAP_IMAGE_KEY, validMapImage } from "./mapImage";
import { useRoom } from "./RoomContext";
import { useY } from "./useY";

export function useMapImage() {
  const room = useRoom();
  const images = useY(room.imagesMap);
  const settings = useY(room.settingsMap);
  return validMapImage(images[MAP_IMAGE_KEY], settings[MAP_IMAGE_KEY]);
}
