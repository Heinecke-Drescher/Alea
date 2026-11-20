import { notifications } from "@mantine/notifications";
import { CONTENT_OUTSIDE_MESSAGE } from "../../room/map";
import type { createMapImage } from "../../room/mapImage";

type MapFit = ReturnType<ReturnType<typeof createMapImage>["placeMapImage"]>;

export function notifyMapFit(result: MapFit, sizeNotAllowedMessage: string) {
  if (result === "contentOutside") {
    notifications.show({ color: "red", message: CONTENT_OUTSIDE_MESSAGE });
  }
  if (result === "sizeNotAllowed") {
    notifications.show({ color: "red", message: sizeNotAllowedMessage });
  }
}
