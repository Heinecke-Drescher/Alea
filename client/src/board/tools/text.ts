import { useMantineTheme } from "@mantine/core";
import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import { measureText } from "../texts/textStyle";
import type { BoardTool } from "./tool";

export interface TextDraft {
  at: Vector2d;
  text: string;
}

export function useTextTool(room: Room, color: string) {
  const { isDm } = usePlayer();
  const theme = useMantineTheme();
  const [draft, setDraft] = useState<TextDraft | null>(null);
  // The field's blur and a click on the map both finish the text, so it is read and cleared once.
  const current = useRef<TextDraft | null>(null);

  function show(next: TextDraft | null) {
    current.current = next;
    setDraft(next);
  }

  function finish() {
    const done = current.current;
    show(null);
    if (!done || done.text.trim() === "") return;
    room.addText({
      text: done.text,
      ...done.at,
      ...measureText(done.text, theme.fontFamily),
      color,
      ...(!isDm && { overFog: true }),
    });
  }

  function write(text: string) {
    if (current.current) show({ ...current.current, text });
  }

  // A click next to the field finishes the text; the next click starts a new one.
  const tool: BoardTool = {
    selectsItems: false,
    listensToStrokes: false,
    onDown({ point, event }) {
      // Otherwise the browser moves the focus to the clicked map and the new field closes at once.
      event.evt.preventDefault();
      if (current.current) finish();
      else show({ at: point, text: "" });
    },
    onMove() {},
    onUp() {},
    onCancel() {
      show(null);
    },
  };

  return {
    tool,
    textDraft: draft,
    writeText: write,
    finishText: finish,
    cancelText: () => show(null),
  };
}
