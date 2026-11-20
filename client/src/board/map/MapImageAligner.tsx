import { useMantineTheme } from "@mantine/core";
import type { Rect as RectNode } from "konva/lib/shapes/Rect";
import type { Transformer as TransformerNode } from "konva/lib/shapes/Transformer";
import { useEffect, useRef } from "react";
import { Rect, Transformer } from "react-konva";
import {
  isMapImageSize,
  MAP_SIZE_LIMIT_MESSAGE,
  snappedToCells,
  type MapImagePlace,
} from "../../room/mapImage";
import { useRoom } from "../../room/RoomContext";
import { useMapImage } from "../../room/useMapImage";
import { scaledRect } from "./scaledRect";
import { highlightColor } from "../selection/highlight";
import { MAP_IMAGE_NAME, mapImageNode, placeOfNode } from "./mapImageNode";
import { notifyMapFit } from "./notifyMapFit";

const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];

export function MapImageAligner() {
  const place = useMapImage()?.place;
  if (!place) return null;
  return <PlaceAligner place={place} />;
}

// An invisible frame over the image takes the mouse, as the image lies below cells and grid.
function PlaceAligner({ place }: { place: MapImagePlace }) {
  const room = useRoom();
  const theme = useMantineTheme();
  const frameRef = useRef<RectNode>(null);
  const transformerRef = useRef<TransformerNode>(null);

  function mountedNodes() {
    const frame = frameRef.current;
    const transformer = transformerRef.current;
    const stage = frame?.getStage();
    if (!frame || !transformer || !stage) {
      throw new Error("Map image aligner is not mounted");
    }
    return { frame, transformer, stage };
  }

  useEffect(() => {
    const { frame, transformer } = mountedNodes();
    transformer.nodes([frame]);
  }, []);

  const { x, y, width, height, rotation } = place;
  useEffect(() => {
    mountedNodes().transformer.forceUpdate();
  }, [x, y, width, height, rotation]);

  function framedPlace() {
    const { frame } = mountedNodes();
    return placeOfNode(scaledRect(frame), rotation);
  }

  function showPlace(next: MapImagePlace) {
    const { frame, stage } = mountedNodes();
    const node = mapImageNode(next);
    frame.setAttrs({ ...node, scaleX: 1, scaleY: 1 });
    for (const image of stage.find(`.${MAP_IMAGE_NAME}`)) {
      image.setAttrs(node);
    }
  }

  // The room may keep the place it has, which React then would not draw again.
  function placeImage(next: MapImagePlace) {
    const result = room.placeMapImage(next);
    showPlace(result === "noImage" ? place : snappedToCells(next));
    notifyMapFit(result, MAP_SIZE_LIMIT_MESSAGE);
  }

  return (
    <>
      <Rect
        ref={frameRef}
        {...mapImageNode(place)}
        fill="black"
        opacity={0}
        draggable
        onDragMove={() => showPlace(framedPlace())}
        onDragEnd={() => placeImage(framedPlace())}
      />
      <Transformer
        ref={transformerRef}
        enabledAnchors={CORNERS}
        keepRatio
        rotateEnabled={false}
        flipEnabled={false}
        borderStroke={highlightColor(theme)}
        anchorStroke={highlightColor(theme)}
        // Konva hands over the box in screen pixels, which the stage's zoom scales.
        boundBoxFunc={(oldBox, newBox) => {
          const zoom = mountedNodes().stage.scaleX();
          const fits = [newBox.width, newBox.height].every((size) =>
            isMapImageSize(size / zoom),
          );
          return fits ? newBox : oldBox;
        }}
        onTransform={() => showPlace(framedPlace())}
        onTransformEnd={() => placeImage(framedPlace())}
      />
    </>
  );
}
