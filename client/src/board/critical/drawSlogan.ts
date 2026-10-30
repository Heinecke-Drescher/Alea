import { Easings } from "konva/lib/Tween";

const LETTER_DELAY_SECONDS = 0.05;
const LETTER_POP_SECONDS = 0.3;
const SWAY_SPEED = 8;
const SWAY_OFFSET = 0.6;
// Shares of the font size.
const OUTLINE_WIDTH = 0.14;
const SWAY_HEIGHT = 0.055;
// How much wider a squashed letter gets for the height it loses.
const SQUASH_SPREAD = 1 / 3;

export interface Slogan {
  text: string;
  x: number;
  y: number;
  // 0 starts the text at x, 1 ends it there.
  align: number;
  size: number;
  // In degrees.
  tilt: number;
  fontFamily: string;
  fill: string;
  outline: string;
  // Below 1 flattens the letters onto their bottom, as if something lies on them.
  squash?: number;
}

// The letters pop up one after another, then sway a little; `seconds` since the first one.
export function drawSlogan(
  canvas: CanvasRenderingContext2D,
  {
    text,
    x,
    y,
    align,
    size,
    tilt,
    fontFamily,
    fill,
    outline,
    squash = 1,
  }: Slogan,
  seconds: number,
) {
  canvas.save();
  canvas.translate(x, y);
  canvas.rotate((tilt * Math.PI) / 180);
  canvas.font = `italic 900 ${size}px ${fontFamily}`;
  canvas.textAlign = "center";
  canvas.textBaseline = "middle";
  canvas.lineJoin = "round";
  canvas.lineWidth = size * OUTLINE_WIDTH;
  canvas.strokeStyle = outline;
  canvas.fillStyle = fill;
  const width = canvas.measureText(text).width;
  const eachLetter = (draw: (letter: string) => void) => {
    [...text].forEach((letter, i) => {
      const popped = Math.min(
        (seconds - i * LETTER_DELAY_SECONDS) / LETTER_POP_SECONDS,
        1,
      );
      if (popped <= 0) return;
      // Measured up to and with the letter, so the font's spacing between letter pairs stays.
      const right = canvas.measureText(text.slice(0, i + 1)).width;
      const sway = Math.sin(seconds * SWAY_SPEED + i * SWAY_OFFSET) * popped;
      canvas.save();
      canvas.translate(
        right - canvas.measureText(letter).width / 2 - width * align,
        size / 2 + sway * size * SWAY_HEIGHT,
      );
      const scale = Easings.BackEaseOut(popped, 0, 1, 1);
      canvas.translate(0, (size / 2) * (1 - squash));
      canvas.scale(scale * (1 + (1 - squash) * SQUASH_SPREAD), scale * squash);
      draw(letter);
      canvas.restore();
    });
  };
  // All outlines first, so no outline covers the neighbouring letter.
  eachLetter((letter) => canvas.strokeText(letter, 0, 0));
  eachLetter((letter) => canvas.fillText(letter, 0, 0));
  canvas.restore();
}
