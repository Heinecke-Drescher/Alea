import type { Vector2d } from "konva/lib/types";
import { useCallback, useState } from "react";
import { Group } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { useY } from "../../room/useY";
import { ThrownDie } from "./ThrownDie";

interface ThrownDiceProps {
  viewCenter: () => Vector2d;
  landings: Map<string, Vector2d>;
}

// Mounted once the room is synced, so rolls loaded from the server are not thrown again.
export function ThrownDice({ viewCenter, landings }: ThrownDiceProps) {
  const room = useRoom();
  const rolls = useY(room.rollsArray);
  const [earlierRollIds] = useState(
    () => new Set(room.rollsArray.toArray().map((roll) => roll.id)),
  );
  const [doneRollIds, setDoneRollIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const markDone = useCallback(
    (id: string) => setDoneRollIds((ids) => new Set(ids).add(id)),
    [],
  );

  return (
    <Group listening={false}>
      {rolls.map((roll) =>
        !earlierRollIds.has(roll.id) && !doneRollIds.has(roll.id) ? (
          <ThrownDie
            key={roll.id}
            roll={roll}
            viewCenter={viewCenter}
            landings={landings}
            onDone={markDone}
          />
        ) : null,
      )}
    </Group>
  );
}
