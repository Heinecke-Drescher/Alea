import type { Stage as StageNode } from "konva/lib/Stage";
import type { DragEvent, RefObject } from "react";
import { useDieDrop } from "./useDieDrop";
import { useImageDrop } from "./useImageDrop";
import { useTokenDrop } from "./useTokenDrop";

// Each one only reacts to its own kind of drag: dice, image files or tokens from the sidebar.
export function useBoardDrops(
  stageRef: RefObject<StageNode | null>,
  onTokenCopied: (tokenId: string) => void,
) {
  const drops = [
    useDieDrop({ stageRef }),
    useImageDrop(stageRef),
    useTokenDrop(stageRef, onTokenCopied),
  ];

  return {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      for (const drop of drops) drop.onDragOver(event);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      for (const drop of drops) drop.onDrop(event);
    },
  };
}
