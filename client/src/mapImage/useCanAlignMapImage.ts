import { useCanChangeMap } from "../player/useCanChangeMap";
import { useMapImage } from "../room/useMapImage";

export function useCanAlignMapImage() {
  const canChange = useCanChangeMap();
  const mapImage = useMapImage();
  return canChange && mapImage !== null;
}
