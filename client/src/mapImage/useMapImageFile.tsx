import {
  createImage,
  LARGE_IMAGE_FILE_MEGABYTES,
  LARGE_IMAGE_SIZE,
} from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { MAP_IMAGE_KEY } from "../room/mapImage";
import { useRoom } from "../room/RoomContext";
import { useMapImage } from "../room/useMapImage";
import { useCanSetMapImage } from "./useCanSetMapImage";

async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

export function useMapImageFile(onSet: () => void) {
  const room = useRoom();
  const chooseMapImage = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: async (file) => {
      const size = await imageSize(file);
      const image = await createImage(file, LARGE_IMAGE_SIZE);
      room.assertSpaceForImage(image, MAP_IMAGE_KEY);
      room.setMapImage(image, size);
      onSet();
    },
  });

  return {
    canSet: useCanSetMapImage(),
    hasMapImage: useMapImage() !== null,
    chooseMapImage,
    removeMapImage: room.removeMapImage,
  };
}
