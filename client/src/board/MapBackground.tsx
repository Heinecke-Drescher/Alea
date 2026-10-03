import { Image } from "react-konva";
import useImage from "use-image";
import { BACKGROUND_IMAGE_ID } from "../room/background";
import { mapRect } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { embeddedImage } from "../room/tokens";
import { useMapBounds } from "../room/useMapBounds";
import { useY } from "../room/useY";

function BackgroundImage({ imageDataUrl }: { imageDataUrl: string }) {
  const bounds = useMapBounds();
  const [image, status] = useImage(imageDataUrl);
  if (status === "failed") {
    throw new Error("Map background could not be loaded");
  }
  return <Image image={image} {...mapRect(bounds)} />;
}

export function MapBackground() {
  const room = useRoom();
  const images = useY(room.imagesMap);
  const imageDataUrl = embeddedImage(images[BACKGROUND_IMAGE_ID]);
  return imageDataUrl && <BackgroundImage imageDataUrl={imageDataUrl} />;
}
