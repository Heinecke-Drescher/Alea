import { notifications } from "@mantine/notifications";

export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

function imageFileRule(maxMegabytes: number) {
  return `Only PNG, JPEG, WebP, GIF or AVIF up to ${maxMegabytes} MB`;
}

function isImageFile(file: File, maxMegabytes: number) {
  return (
    IMAGE_TYPES.includes(file.type) && file.size <= maxMegabytes * 1024 ** 2
  );
}

// Reports the files that are no images or too large and returns the others.
export function validImages(files: File[], maxMegabytes: number) {
  const images = files.filter((file) => isImageFile(file, maxMegabytes));
  for (const file of files) {
    if (images.includes(file)) continue;
    notifyFileError(file, new Error(imageFileRule(maxMegabytes)));
  }
  return images;
}

function notifyFileError(file: File, error: unknown) {
  console.error(error);
  notifications.show({
    color: "red",
    title: `Could not add ${file.name}`,
    message: error instanceof Error ? error.message : String(error),
  });
}

export async function handleImageFile(
  file: File,
  onFile: (file: File) => Promise<void>,
) {
  try {
    await onFile(file);
  } catch (error) {
    notifyFileError(file, error);
  }
}
