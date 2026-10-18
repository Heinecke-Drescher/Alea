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
import type { StatusEffect } from "../../room/effects";
import { TOOLTIP_DELAY } from "../../theme";
import { EFFECT_LABELS } from "./effectIcons";
import { effectAt } from "./tokenNodes";

interface EffectTooltipProps {
  stageRef: RefObject<Stage | null>;
  children: ReactNode;
}

export function EffectTooltip({ stageRef, children }: EffectTooltipProps) {
  const [effect, setEffect] = useState<StatusEffect | null>(null);
  const hovered = useRef<StatusEffect | null>(null);
  const { start, clear } = useTimeout(setEffect, TOOLTIP_DELAY);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");

    function hover(next: StatusEffect | null) {
      if (next === hovered.current) return;
      hovered.current = next;
      clear();
      setEffect(null);
      if (next) start(next);
    }

    stage.on("mousemove.effectTooltip", (event) =>
      hover(effectAt(event.target)),
    );
    stage.on("mouseleave.effectTooltip", () => hover(null));
    return () => {
      stage.off(".effectTooltip");
    };
  }, [stageRef, start, clear]);

  return (
    <Tooltip.Floating
      label={effect && EFFECT_LABELS[effect]}
      disabled={!effect}
    >
      {children}
    </Tooltip.Floating>
  );
}
