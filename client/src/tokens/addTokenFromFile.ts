import { createImage, TOKEN_IMAGE_SIZE } from "../images/createImage";
import type { Room } from "../room/createRoom";
import type { Square } from "../room/grid";

export const TOKEN_FILE_MEGABYTES = 5;

interface Placement {
  cell?: { x: number; y: number };
  blocked?: Square[];
}

export async function addTokenFromFile(
  room: Room,
  file: File,
  { cell, blocked }: Placement = {},
) {
  const imageDataUrl = await createImage(file, TOKEN_IMAGE_SIZE);
  room.assertSpaceForImage(imageDataUrl);
  room.addToken(file.name.replace(/\.[^.]+$/, ""), imageDataUrl, cell, blocked);
}
