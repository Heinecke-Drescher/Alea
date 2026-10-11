import type { Group as GroupNode } from "konva/lib/Group";
import { useEffect, useRef, useState } from "react";

export function useStageZoom() {
  const groupRef = useRef<GroupNode>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const stage = groupRef.current?.getStage();
    if (!stage) throw new Error("Group is not on a stage");
    const updateZoom = () => setZoom(stage.scaleX());
    stage.on("scaleXChange", updateZoom);
    return () => {
      stage.off("scaleXChange", updateZoom);
    };
  }, []);

  return { groupRef, zoom };
}
