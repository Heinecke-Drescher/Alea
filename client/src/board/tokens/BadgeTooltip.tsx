import { Tooltip } from "@mantine/core";
import { useTimeout } from "@mantine/hooks";
import type { Stage } from "konva/lib/Stage";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { TOOLTIP_DELAY } from "../../theme";
import { badgeLabelAt } from "./tokenNodes";

interface BadgeTooltipProps {
  stageRef: RefObject<Stage | null>;
  children: ReactNode;
}

export function BadgeTooltip({ stageRef, children }: BadgeTooltipProps) {
  const [label, setLabel] = useState<string | null>(null);
  const hovered = useRef<string | null>(null);
  const { start, clear } = useTimeout(setLabel, TOOLTIP_DELAY);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");

    function hover(next: string | null) {
      if (next === hovered.current) return;
      hovered.current = next;
      clear();
      setLabel(null);
      if (next !== null) start(next);
    }

    stage.on("mousemove.badgeTooltip", (event) =>
      hover(badgeLabelAt(event.target)),
    );
    stage.on("mouseleave.badgeTooltip", () => hover(null));
    return () => {
      stage.off(".badgeTooltip");
    };
  }, [stageRef, start, clear]);

  return (
    <Tooltip.Floating label={label} disabled={label === null}>
      {children}
    </Tooltip.Floating>
  );
}
