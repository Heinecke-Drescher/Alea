import { Button, FileButton } from "@mantine/core";
import { useRef } from "react";
import { handleImageFile, IMAGE_TYPES, validImages } from "./imageFiles";

interface ImageFileButtonProps {
  label: string;
  maxMegabytes: number;
  multiple: boolean;
  onFile: (file: File) => Promise<void>;
}

export function ImageFileButton({
  label,
  maxMegabytes,
  multiple,
  onFile,
}: ImageFileButtonProps) {
  const resetRef = useRef<() => void>(null);

  function addFiles(picked: File | File[] | null) {
    const files = picked === null ? [] : [picked].flat();
    for (const file of validImages(files, maxMegabytes)) {
      void handleImageFile(file, onFile);
    }
    // Without a reset, picking the same file again fires no change.
    const reset = resetRef.current;
    if (!reset) throw new Error("File button is not mounted");
    reset();
  }

  return (
    <FileButton
      resetRef={resetRef}
      accept={IMAGE_TYPES.join(",")}
      multiple={multiple}
      onChange={addFiles}
    >
      {(props) => (
        <Button variant="light" {...props}>
          {label}
        </Button>
      )}
    </FileButton>
  );
}
