import { createImage } from "../images/createImage";
import type { Room } from "../room/createRoom";

export const BACKGROUND_FILE_MEGABYTES = 20;
// Large enough to look sharp on big screens, small enough to sync quickly to every player.
const BACKGROUND_IMAGE_SIZE = { maxWidth: 2500, maxHeight: 2500 };

export async function setBackgroundFromFile(room: Room, file: File) {
  room.setBackground(await createImage(file, BACKGROUND_IMAGE_SIZE));
}
