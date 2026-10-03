import { notifications } from "@mantine/notifications";

export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

export function imageFileRule(maxMegabytes: number) {
  return `Only PNG, JPEG, WebP, GIF or AVIF up to ${maxMegabytes} MB`;
}

export function isImageFile(file: File, maxMegabytes: number) {
  return (
    IMAGE_TYPES.includes(file.type) && file.size <= maxMegabytes * 1024 ** 2
  );
}

export function notifyFileError(file: File, error: unknown) {
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
