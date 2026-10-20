import { useFileDialog } from "@mantine/hooks";
import { useEffect, useRef } from "react";
import { handleImageFile, IMAGE_TYPES, validImages } from "./imageFiles";

interface ImageFileDialogOptions {
  maxMegabytes: number;
  multiple: boolean;
  onFile: (file: File) => Promise<void>;
}

export function useImageFileDialog({
  maxMegabytes,
  multiple,
  onFile,
}: ImageFileDialogOptions) {
  // The dialog keeps the callback from when it opened; files may arrive after the fog changed.
  const latestOnFile = useRef(onFile);
  useEffect(() => {
    latestOnFile.current = onFile;
  });

  const fileDialog = useFileDialog({
    multiple,
    accept: IMAGE_TYPES.join(","),
    onChange: (files) => {
      for (const file of validImages(Array.from(files ?? []), maxMegabytes)) {
        void handleImageFile(file, (image) => latestOnFile.current(image));
      }
    },
  });
  return fileDialog.open;
}
