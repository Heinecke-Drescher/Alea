import { createImage, TOKEN_IMAGE_SIZE } from "../images/createImage";
import type { Room } from "../room/createRoom";
import type { HeldToken } from "./holdTokens";

export const TOKEN_FILE_MEGABYTES = 5;

export async function tokenFromFile(
  room: Room,
  file: File,
): Promise<HeldToken> {
  const imageDataUrl = await createImage(file, TOKEN_IMAGE_SIZE);
  room.assertSpaceForImage(imageDataUrl);
  return { name: file.name.replace(/\.[^.]+$/, ""), imageDataUrl };
}

export async function addTokenFromFile(
  room: Room,
  file: File,
  cell: { x: number; y: number },
) {
  const { name, imageDataUrl } = await tokenFromFile(room, file);
  room.addToken(name, imageDataUrl, cell);
}
