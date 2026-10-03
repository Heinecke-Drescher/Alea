import { BACKGROUND_IMAGE_ID } from "./background";
import { useRoom } from "./RoomContext";
import { embeddedImage } from "./tokens";
import { useY } from "./useY";

export function useBackgroundImage() {
  const room = useRoom();
  return embeddedImage(useY(room.imagesMap)[BACKGROUND_IMAGE_ID]);
}
