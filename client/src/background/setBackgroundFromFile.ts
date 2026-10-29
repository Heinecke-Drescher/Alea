import { createImage, LARGE_IMAGE_SIZE } from "../images/createImage";
import { BACKGROUND_IMAGE_ID } from "../room/background";
import type { Room } from "../room/createRoom";

export async function setBackgroundFromFile(room: Room, file: File) {
  const image = await createImage(file, LARGE_IMAGE_SIZE);
  room.assertSpaceForImage(image, BACKGROUND_IMAGE_ID);
  room.setBackground(image);
}
