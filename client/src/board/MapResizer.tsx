import { useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Rect as RectNode } from "konva/lib/shapes/Rect";
import type { Transformer as TransformerNode } from "konva/lib/shapes/Transformer";
import { useEffect, useRef } from "react";
import { Rect, Transformer } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { useMapBounds } from "../room/useMapBounds";
import { mapRect, snapMapBounds, type MapBounds } from "../room/grid";

export function MapResizer() {
  const room = useRoom();
  const theme = useMantineTheme();
  const bounds = useMapBounds();
  const rectRef = useRef<RectNode>(null);
  const transformerRef = useRef<TransformerNode>(null);

  function mountedNodes() {
    const rect = rectRef.current;
    const transformer = transformerRef.current;
    if (!rect || !transformer) throw new Error("Map resizer is not mounted");
    return { rect, transformer };
  }

  useEffect(() => {
    const { rect, transformer } = mountedNodes();
    transformer.nodes([rect]);
  }, []);

  function showBounds(next: MapBounds) {
    mountedNodes().rect.setAttrs({ ...mapRect(next), scaleX: 1, scaleY: 1 });
  }

  function snappedBounds() {
    const { rect, transformer } = mountedNodes();
    const anchor = transformer.getActiveAnchor();
    if (!anchor) throw new Error("Map is resized without an anchor");
    return snapMapBounds(
      {
        x: rect.x(),
        y: rect.y(),
        width: rect.width() * rect.scaleX(),
        height: rect.height() * rect.scaleY(),
      },
      anchor,
    );
  }

  return (
    <>
      <Rect ref={rectRef} {...mapRect(bounds)} listening={false} />
      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        flipEnabled={false}
        keepRatio={false}
        borderStroke={theme.colors.blue[6]}
        borderDash={[8, 4]}
        anchorStroke={theme.colors.blue[6]}
        // Converts Konva's scaling into whole cells while dragging.
        onTransform={() => showBounds(snappedBounds())}
        onTransformEnd={() => {
          const next = snappedBounds();
          if (room.resize(next)) return;
          showBounds(bounds);
          notifications.show({
            color: "red",
            message: "Move or delete what is outside the new size first.",
          });
        }}
      />
    </>
  );
}
