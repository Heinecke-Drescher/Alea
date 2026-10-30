import { useMantineTheme } from "@mantine/core";
import { Html } from "react-konva-utils";
import { MAX_TEXT_LENGTH } from "../../room/texts";
import type { TextDraft } from "../tools/text";
import { measureText, TEXT_FONT_SIZE, TEXT_LINE_HEIGHT } from "./textStyle";

interface TextEditorProps {
  draft: TextDraft;
  color: string;
  onWrite: (text: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

// A DOM field over the map, as Konva cannot edit text; Html follows zoom and panning.
export function TextEditor({
  draft,
  color,
  onWrite,
  onFinish,
  onCancel,
}: TextEditorProps) {
  const theme = useMantineTheme();
  // One more character of room keeps the caret visible at the end of the line.
  const size = measureText(`${draft.text}M`, theme.fontFamily);

  return (
    <Html groupProps={draft.at}>
      <textarea
        aria-label="Text"
        autoFocus
        value={draft.text}
        maxLength={MAX_TEXT_LENGTH}
        onChange={(event) => onWrite(event.target.value)}
        onBlur={onFinish}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onFinish();
          }
        }}
        style={{
          width: size.width,
          height: size.height,
          padding: 0,
          margin: 0,
          border: "none",
          outline: `1px dashed ${color}`,
          background: "none",
          resize: "none",
          overflow: "hidden",
          whiteSpace: "pre",
          color,
          fontFamily: theme.fontFamily,
          fontSize: TEXT_FONT_SIZE,
          lineHeight: TEXT_LINE_HEIGHT,
        }}
      />
    </Html>
  );
}
