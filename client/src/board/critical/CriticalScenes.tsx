import type { Vector2d } from "konva/lib/types";
import type { Critical } from "../../dice/criticalRoll";
import { Natural1Scene } from "./Natural1Scene";
import { Natural20Scene } from "./Natural20Scene";

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
  const Scene = critical.kind === "natural20" ? Natural20Scene : Natural1Scene;
  return (
    <Scene
      key={critical.id}
      critical={critical}
      landings={landings}
      onDone={onDone}
    />
  );
}
