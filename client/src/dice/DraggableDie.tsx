import type { DieSides } from "../room/dice";
import type { PlayerColor } from "../room/playerColors";
import { DragGhost } from "../DragGhost";
import { useScreenDrag } from "../useScreenDrag";
import { DieButton, DieFace } from "./DieButton";
import { useThrowDie } from "./throwDie";

interface DraggableDieProps {
  sides: DieSides;
  color: PlayerColor;
  onRoll: () => void;
}

export function DraggableDie({ sides, color, onRoll }: DraggableDieProps) {
  const throwDie = useThrowDie();
  const { handlers, ghostStart, ghostRef, isClickIgnored } = useScreenDrag(
    (samples) => throwDie(sides, samples),
  );

  return (
    <>
      <DieButton
        sides={sides}
        color={color}
        onRoll={() => {
          if (!isClickIgnored()) onRoll();
        }}
        drag={handlers}
      />
      <DragGhost start={ghostStart} ref={ghostRef}>
        <DieFace sides={sides} color={color} />
      </DragGhost>
    </>
  );
}
