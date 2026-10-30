import { ActionIcon, Tooltip } from "@mantine/core";
import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";
import { useRoom } from "../room/RoomContext";
import { undoStep, useUndoState } from "../undo/useUndo";

// Its own component, so only these buttons render again when the undo history changes.
export function UndoButtons() {
  const room = useRoom();
  const { canUndo, canRedo } = useUndoState(room);

  return (
    <>
      <Tooltip label="Undo (Ctrl+Z)" position="top">
        <ActionIcon
          variant="subtle"
          size="lg"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => undoStep(room.undo)}
        >
          <IconArrowBackUp size={20} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Redo (Ctrl+Y)" position="top">
        <ActionIcon
          variant="subtle"
          size="lg"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => undoStep(room.redo)}
        >
          <IconArrowForwardUp size={20} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}
