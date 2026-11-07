import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import { NEW_MARK, tokenMarks } from "../room/marks";
import { MarkForm } from "./MarkForm";

// Without an index the dialog adds a new mark.
export function openMarkDialog(room: Room, tokenId: string, index?: number) {
  const token = room.tokensMap.get(tokenId);
  if (!token) return;
  const current = index === undefined ? undefined : tokenMarks(token)[index];
  if (index !== undefined && !current) return;
  const modalId = modals.open({
    title: current ? "Edit mark" : "Add mark",
    centered: true,
    children: (
      <MarkForm
        current={current ?? NEW_MARK}
        onSave={(mark) => {
          if (index === undefined) room.addMark(tokenId, mark);
          else room.changeMark(tokenId, index, mark);
          modals.close(modalId);
        }}
        onCancel={() => modals.close(modalId)}
        {...(index !== undefined && {
          onDelete: () => {
            room.removeMark(tokenId, index);
            modals.close(modalId);
          },
        })}
      />
    ),
  });
}
