import {
  createImage,
  LARGE_IMAGE_FILE_MEGABYTES,
  LARGE_IMAGE_SIZE,
} from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { MAP_IMAGE_KEY } from "../room/mapImage";
import { useRoom } from "../room/RoomContext";
import { useMapImage } from "../room/useMapImage";
import { useCanChangeMap } from "../player/useCanChangeMap";

async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

// Setting an image goes on to aligning it, which is also offered on its own.
export function useMapImageFile(onAlign: () => void) {
  const room = useRoom();
  const chooseMapImage = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: async (file) => {
      const size = await imageSize(file);
      const image = await createImage(file, LARGE_IMAGE_SIZE);
      room.assertSpaceForImage(image, MAP_IMAGE_KEY);
      room.setMapImage(image, size);
      onAlign();
    },
  });

  return {
    canSet: useCanChangeMap(),
    hasMapImage: useMapImage() !== null,
    chooseMapImage,
    alignMapImage: onAlign,
    removeMapImage: room.removeMapImage,
  };
}
