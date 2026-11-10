import type { Clip } from "../../room/areaActions";
import type { HeldToken } from "../../tokens/holdTokens";

// As square as can be, so a group of new tokens lands close together.
export function heldTokensClip(tokens: HeldToken[]): Clip {
  const columns = Math.ceil(Math.sqrt(tokens.length));
  return {
    cells: [],
    strokes: [],
    texts: [],
    tokens: tokens.map(({ name, imageDataUrl }, i) => ({
      name,
      image: imageDataUrl,
      x: i % columns,
      y: Math.floor(i / columns),
      size: 1,
      effects: [],
    })),
  };
}
