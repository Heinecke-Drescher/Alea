import { Text } from "konva/lib/shapes/Text";

export const TEXT_FONT_SIZE = 24;
export const TEXT_LINE_HEIGHT = 1.2;

// Measured with the same font as the shown text, so the stored size matches what others see.
export function measureText(text: string, fontFamily: string) {
  const node = new Text({
    text,
    fontFamily,
    fontSize: TEXT_FONT_SIZE,
    lineHeight: TEXT_LINE_HEIGHT,
  });
  const size = { width: node.width(), height: node.height() };
  node.destroy();
  return size;
}
