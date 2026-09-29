import Compressor from "compressorjs";

const TOKEN_IMAGE_SIZE = 128;

export async function createTokenImage(file: File): Promise<string> {
  const shrunk = await shrink(file);
  return readAsDataUrl(shrunk);
}

function shrink(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      width: TOKEN_IMAGE_SIZE,
      height: TOKEN_IMAGE_SIZE,
      resize: "cover",
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
