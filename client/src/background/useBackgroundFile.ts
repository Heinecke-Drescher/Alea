import { useImageFileDialog } from "../images/useImageFileDialog";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";
import {
  BACKGROUND_FILE_MEGABYTES,
  setBackgroundFromFile,
} from "./setBackgroundFromFile";

export function useBackgroundFile() {
  const room = useRoom();
  const chooseBackground = useImageFileDialog({
    maxMegabytes: BACKGROUND_FILE_MEGABYTES,
    multiple: false,
    onFile: (file) => setBackgroundFromFile(room, file),
  });

  return {
    hasBackground: useBackgroundImage() !== null,
    chooseBackground,
    removeBackground: room.removeBackground,
  };
}
