import { Tooltip } from "@mantine/core";
import type { Stage } from "konva/lib/Stage";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import type { StatusEffect } from "../room/effects";
import { EFFECT_LABELS } from "./effectIcons";
import { effectAt } from "./tokenNodes";

interface EffectTooltipProps {
  stageRef: RefObject<Stage | null>;
  children: ReactNode;
}

export function EffectTooltip({ stageRef, children }: EffectTooltipProps) {
  const [effect, setEffect] = useState<StatusEffect | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.on("mousemove.effectTooltip", (event) =>
      setEffect(effectAt(event.target)),
    );
    stage.on("mouseleave.effectTooltip", () => setEffect(null));
    return () => {
      stage.off(".effectTooltip");
    };
  }, [stageRef]);

  return (
    <Tooltip.Floating
      label={effect && EFFECT_LABELS[effect]}
      disabled={!effect}
    >
      {children}
    </Tooltip.Floating>
  );
}
