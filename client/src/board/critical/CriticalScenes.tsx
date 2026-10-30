import type { Vector2d } from "konva/lib/types";
import type { ComponentType } from "react";
import type { CriticalKind, Critical } from "../../dice/criticalRoll";
import type { CriticalSceneProps } from "./CriticalScene";
import { Natural1Scene } from "./Natural1Scene";
import { Natural20Scene } from "./Natural20Scene";

// A new kind of critical roll does not compile until it has a scene.
const SCENES: Record<CriticalKind, ComponentType<CriticalSceneProps>> = {
  natural20: Natural20Scene,
  natural1: Natural1Scene,
};

interface CriticalScenesProps {
  critical: Critical | null;
  landings: ReadonlyMap<string, Vector2d>;
  onDone: (id: string) => void;
}

export function CriticalScenes({
  critical,
  landings,
  onDone,
}: CriticalScenesProps) {
  if (!critical) return null;
  const Scene = SCENES[critical.kind];
  return (
    <Scene
      key={critical.id}
      critical={critical}
      landings={landings}
      onDone={onDone}
    />
  );
}
