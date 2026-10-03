import { Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

interface ImageDropzoneProps {
  maxMegabytes: number;
  multiple: boolean;
  label: string;
  acceptLabel: string;
  onFile: (file: File) => Promise<void>;
}

async function handleFile(file: File, onFile: (file: File) => Promise<void>) {
  try {
    await onFile(file);
  } catch (error) {
    console.error(error);
    notifications.show({
      color: "red",
      title: `Could not add ${file.name}`,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function ImageDropzone({
  maxMegabytes,
  multiple,
  label,
  acceptLabel,
  onFile,
}: ImageDropzoneProps) {
  return (
    <Dropzone
      accept={IMAGE_TYPES}
      maxSize={maxMegabytes * 1024 ** 2}
      multiple={multiple}
      onDrop={(files) => files.forEach((file) => void handleFile(file, onFile))}
    >
      <Dropzone.Idle>
        <Text ta="center" c="dimmed">
          {label}
        </Text>
      </Dropzone.Idle>
      <Dropzone.Accept>
        <Text ta="center">{acceptLabel}</Text>
      </Dropzone.Accept>
      <Dropzone.Reject>
        <Text ta="center" c="red">
          Only PNG, JPEG, WebP, GIF or AVIF up to {maxMegabytes} MB
        </Text>
      </Dropzone.Reject>
    </Dropzone>
  );
}
