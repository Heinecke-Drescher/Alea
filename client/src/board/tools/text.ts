import { useMantineTheme } from "@mantine/core";
import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { useFogGuard } from "../../fog/useFogGuard";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import {
  textFontSize,
  validMapText,
  type TextFontSize,
} from "../../room/texts";
import { textIdAt } from "../texts/textNodes";
import { measureText } from "../texts/textStyle";
import type { BoardTool } from "./tool";

export interface TextDraft {
  // Only a text that is already on the map has an id.
  id?: string;
  at: Vector2d;
  text: string;
  color: string;
  fontSize: TextFontSize;
}

export function useTextTool(room: Room, color: string, fontSize: TextFontSize) {
  const { isDm } = usePlayer();
  const theme = useMantineTheme();
  const fogGuard = useFogGuard();
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
    if (!done) return;
    const words = done.text.trim() === "" ? "" : done.text;
    if (done.id !== undefined) {
      const size = measureText(words, theme.fontFamily, done.fontSize);
      const text = validMapText(room.textsMap.get(done.id));
      // Players' texts lie above the fog, so only the DM's are kept out of it.
      const grown = text && words !== "" && { ...text, ...size };
      if (grown && !grown.overFog && fogGuard.hidesRect(grown)) return;
      room.editText(done.id, { text: words, ...size });
      return;
    }
    if (words === "") return;
    room.addText({
      text: words,
      ...done.at,
      ...measureText(words, theme.fontFamily, done.fontSize),
      color: done.color,
      fontSize: done.fontSize,
      ...(!isDm && { overFog: true }),
    });
  }

  function edit(id: string) {
    const text = validMapText(room.textsMap.get(id));
    if (!text) return;
    show({
      id,
      at: { x: text.x, y: text.y },
      text: text.text,
      color: text.color,
      fontSize: textFontSize(text),
    });
  }

  function write(text: string) {
    if (current.current) show({ ...current.current, text });
  }

  // A click next to the field finishes the text; the next click starts a new one or opens
  // the text under it.
  const tool: BoardTool = {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point, event }) {
      // Otherwise the browser moves the focus to the clicked map and the new field closes at once.
      event.evt.preventDefault();
      if (current.current) {
        finish();
        return;
      }
      const id = textIdAt(event.target);
      if (id) edit(id);
      else show({ at: point, text: "", color, fontSize });
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
    editText: edit,
    writeText: write,
    finishText: finish,
    cancelText: () => show(null),
  };
}
