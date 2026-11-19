import { LARGE_IMAGE_FILE_MEGABYTES } from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { useCanChangeMap } from "../player/useCanChangeMap";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";
import { setBackgroundFromFile } from "./setBackgroundFromFile";

export function useBackgroundFile() {
  const room = useRoom();
  const chooseBackground = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: (file) => setBackgroundFromFile(room, file),
  });

  return {
    canSet: useCanChangeMap(),
    hasBackground: useBackgroundImage() !== null,
    chooseBackground,
    removeBackground: room.removeBackground,
  };
}
