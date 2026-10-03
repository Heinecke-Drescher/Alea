import { createImage } from "../images/createImage";
import type { Room } from "../room/createRoom";

export const TOKEN_FILE_MEGABYTES = 5;
const TOKEN_IMAGE_SIZE = { width: 128, height: 128, resize: "cover" } as const;

export async function addTokenFromFile(
  room: Room,
  file: File,
  cell?: { x: number; y: number },
) {
  const imageDataUrl = await createImage(file, TOKEN_IMAGE_SIZE);
  room.addToken(file.name.replace(/\.[^.]+$/, ""), imageDataUrl, cell);
}
