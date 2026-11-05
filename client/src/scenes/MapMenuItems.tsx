import { Menu } from "@mantine/core";
import type { MapActions } from "./useMapActions";

interface SceneItems {
  rename: () => void;
  deleteScene: () => void;
  canDelete: boolean;
}

export function MapMenuItems({
  actions: { files, mapImage, background, drawings },
  scene,
}: {
  actions: MapActions;
  scene?: SceneItems;
}) {
  return (
    <>
      {scene && (
        <>
          <Menu.Item onClick={scene.rename}>Rename</Menu.Item>
          <Menu.Divider />
        </>
      )}
      {files.canImport && (
        <Menu.Item onClick={files.importMap}>Import map…</Menu.Item>
      )}
      <Menu.Item onClick={files.exportMap}>Export map</Menu.Item>
      <Menu.Divider />
      {mapImage.canSet && (
        <Menu.Item onClick={mapImage.chooseMapImage}>Set map image…</Menu.Item>
      )}
      {mapImage.canSet && mapImage.hasMapImage && (
        <Menu.Item color="red" onClick={mapImage.removeMapImage}>
          Remove map image
        </Menu.Item>
      )}
      <Menu.Item onClick={background.chooseBackground}>
        Set background…
      </Menu.Item>
      {background.hasBackground && (
        <Menu.Item color="red" onClick={background.removeBackground}>
          Remove background
        </Menu.Item>
      )}
      {(drawings.canClear || scene) && <Menu.Divider />}
      {drawings.canClear && (
        <Menu.Item color="red" onClick={drawings.clearDrawings}>
          Clear drawings…
        </Menu.Item>
      )}
      {scene && (
        <Menu.Item
          color="red"
          disabled={!scene.canDelete}
          onClick={scene.deleteScene}
        >
          Delete scene…
        </Menu.Item>
      )}
    </>
  );
}
