import Compressor from "compressorjs";

export type ImageSize = Pick<
  Compressor.Options,
  "width" | "height" | "maxWidth" | "maxHeight" | "resize"
>;

// For backgrounds and map images: large enough to look sharp on big screens, small enough to
// sync quickly to every player.
export const LARGE_IMAGE_SIZE = { maxWidth: 2500, maxHeight: 2500 };
export const LARGE_IMAGE_FILE_MEGABYTES = 20;

export async function createImage(
  file: File,
  size: ImageSize,
): Promise<string> {
  const shrunk = await shrink(file, size);
  return readAsDataUrl(shrunk);
}

function shrink(file: File, size: ImageSize): Promise<Blob> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      ...size,
      mimeType: "image/webp",
      success: resolve,
      error: reject,
    });
  });
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("FileReader did not return a data URL"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
