import { createImage, LARGE_IMAGE_SIZE } from "../images/createImage";
import type { Room } from "../room/createRoom";

export async function setBackgroundFromFile(room: Room, file: File) {
  room.setBackground(await createImage(file, LARGE_IMAGE_SIZE));
}
