import { useMantineTheme } from "@mantine/core";
import type { Rect as RectNode } from "konva/lib/shapes/Rect";
import type { Transformer as TransformerNode } from "konva/lib/shapes/Transformer";
import { useEffect, useRef } from "react";
import { Rect, Transformer } from "react-konva";
import { isMapImageSize, type MapImagePlace } from "../../room/mapImage";
import { useRoom } from "../../room/RoomContext";
import { useMapImage } from "../../room/useMapImage";
import { highlightColor } from "../selection/highlight";
import { MAP_IMAGE_NAME, mapImageNode, placeOfNode } from "./mapImageNode";

const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];

// A click without moving must not leave an empty undo step.
function isSamePlace(a: MapImagePlace, b: MapImagePlace) {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotation === b.rotation
  );
}

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
    return placeOfNode(
      {
        x: frame.x(),
        y: frame.y(),
        width: frame.width() * frame.scaleX(),
        height: frame.height() * frame.scaleY(),
      },
      rotation,
    );
  }

  function showPlace(next: MapImagePlace) {
    const { frame, stage } = mountedNodes();
    const node = mapImageNode(next);
    frame.setAttrs({ ...node, scaleX: 1, scaleY: 1 });
    for (const image of stage.find(`.${MAP_IMAGE_NAME}`)) {
      image.setAttrs(node);
    }
  }

  function placeImage() {
    const next = framedPlace();
    showPlace(next);
    if (isSamePlace(next, place)) return;
    if (!room.placeMapImage(next)) showPlace(place);
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
        onDragEnd={placeImage}
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
        onTransformEnd={placeImage}
      />
    </>
  );
}
