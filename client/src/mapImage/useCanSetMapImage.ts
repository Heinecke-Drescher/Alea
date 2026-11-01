import { usePlayer } from "../player/PlayerContext";
import { useDm } from "../room/useDm";
import { useMapImage } from "../room/useMapImage";

// Like an import, because it changes the map for everyone.
export function useCanSetMapImage() {
  const dm = useDm();
  const { isDm } = usePlayer();
  return dm === null || isDm;
}

export function useCanAlignMapImage() {
  const canSet = useCanSetMapImage();
  const mapImage = useMapImage();
  return canSet && mapImage !== null;
}
