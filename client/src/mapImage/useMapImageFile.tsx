import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  createImage,
  LARGE_IMAGE_FILE_MEGABYTES,
  LARGE_IMAGE_SIZE,
} from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { usePlayer } from "../player/PlayerContext";
import type { Room } from "../room/createRoom";
import { CONTENT_OUTSIDE_MESSAGE } from "../room/map";
import { MAP_IMAGE_KEY } from "../room/mapImage";
import { useRoom } from "../room/RoomContext";
import { useDm } from "../room/useDm";
import { useMapImage } from "../room/useMapImage";
import { MapImageForm } from "./MapImageForm";

async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

function openMapImageDialog(
  room: Room,
  image: string,
  { width, height }: { width: number; height: number },
) {
  const modalId = modals.open({
    title: "Set map image",
    centered: true,
    children: (
      <MapImageForm
        image={image}
        width={width}
        height={height}
        initialColumns={room.mapBounds().columns}
        onSave={(columns, rows) => {
          modals.close(modalId);
          if (!room.setMapImage(image, columns, rows)) {
            notifications.show({
              color: "red",
              message: CONTENT_OUTSIDE_MESSAGE,
            });
          }
        }}
        onCancel={() => modals.close(modalId)}
      />
    ),
  });
}

export function useMapImageFile() {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const chooseMapImage = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: async (file) => {
      const size = await imageSize(file);
      const image = await createImage(file, LARGE_IMAGE_SIZE);
      room.assertSpaceForImage(image, MAP_IMAGE_KEY);
      openMapImageDialog(room, image, size);
    },
  });

  return {
    // Like an import, because it changes the map size for everyone.
    canSet: dm === null || isDm,
    hasMapImage: useMapImage() !== null,
    chooseMapImage,
    removeMapImage: room.removeMapImage,
  };
}
