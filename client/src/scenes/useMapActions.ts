import { useBackgroundFile } from "../background/useBackgroundFile";
import { useClearDrawings } from "../drawings/useClearDrawings";
import { useMapFiles } from "../mapFile/useMapFiles";
import { useMapImageFile } from "../mapImage/useMapImageFile";

// Called where it stays mounted: the file dialogs drop their input when the menu closes.
export function useMapActions(onMapImageSet: () => void) {
  return {
    files: useMapFiles(),
    mapImage: useMapImageFile(onMapImageSet),
    background: useBackgroundFile(),
    drawings: useClearDrawings(),
  };
}

export type MapActions = ReturnType<typeof useMapActions>;
