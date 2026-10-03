import { Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { handleImageFile, IMAGE_TYPES, imageFileRule } from "./imageFiles";

interface ImageDropzoneProps {
  maxMegabytes: number;
  multiple: boolean;
  label: string;
  acceptLabel: string;
  onFile: (file: File) => Promise<void>;
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
      onDrop={(files) =>
        files.forEach((file) => void handleImageFile(file, onFile))
      }
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
          {imageFileRule(maxMegabytes)}
        </Text>
      </Dropzone.Reject>
    </Dropzone>
  );
}
