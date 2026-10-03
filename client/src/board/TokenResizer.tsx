import { useMantineTheme } from "@mantine/core";
import type { Transformer as TransformerNode } from "konva/lib/shapes/Transformer";
import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import { CELL_SIZE, snapTokenSquare, type Square } from "../room/grid";
import type { Token } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";

const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];

interface TokenResizerProps {
  token: Token;
}

export function TokenResizer({ token }: TokenResizerProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const transformerRef = useRef<TransformerNode>(null);

  function mountedTransformer() {
    const transformer = transformerRef.current;
    if (!transformer) throw new Error("Token resizer is not mounted");
    return transformer;
  }

  function tokenNode() {
    const [node] = mountedTransformer().nodes();
    if (!node) throw new Error("Token resizer has no token");
    return node;
  }

  useEffect(() => {
    const transformer = mountedTransformer();
    const node = transformer.getStage()?.findOne(`#${token.id}`);
    if (!node) throw new Error(`Token ${token.id} is not on the stage`);
    transformer.nodes([node]);
  }, [token.id]);

  // The frame follows only changes of the token group itself, not its image growing inside.
  useEffect(() => {
    mountedTransformer().forceUpdate();
  }, [token.x, token.y, token.size]);

  function showSquare({ x, y, size }: Square) {
    tokenNode().setAttrs({
      x: x * CELL_SIZE,
      y: y * CELL_SIZE,
      scaleX: size / token.size,
      scaleY: size / token.size,
    });
  }

  function snappedSquare() {
    const node = tokenNode();
    const anchor = mountedTransformer().getActiveAnchor();
    if (!anchor) throw new Error("Token is resized without an anchor");
    const width = token.size * CELL_SIZE * node.scaleX();
    return snapTokenSquare(
      { x: node.x(), y: node.y(), width, height: width },
      anchor,
    );
  }

  return (
    <Transformer
      ref={transformerRef}
      enabledAnchors={CORNERS}
      keepRatio
      rotateEnabled={false}
      flipEnabled={false}
      borderStroke={theme.colors.blue[6]}
      anchorStroke={theme.colors.blue[6]}
      // Converts Konva's scaling into whole cells while dragging.
      onTransform={() => showSquare(snappedSquare())}
      onTransformEnd={() => {
        const next = snappedSquare();
        // React draws the token from the room data, so the node goes back first.
        showSquare(token);
        room.resizeToken(token.id, next);
      }}
    />
  );
}
