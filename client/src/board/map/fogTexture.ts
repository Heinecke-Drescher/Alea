import { toRgba } from "@mantine/core";
import { createNoise4D, type NoiseFunction4D } from "simplex-noise";

const SIZE = 256;
const OCTAVES = 4;

// Walking two circles through 4D noise wraps at the edges, so the texture tiles without seams.
function cloudiness(noise: NoiseFunction4D, x: number, y: number) {
  const a = (x / SIZE) * 2 * Math.PI;
  const b = (y / SIZE) * 2 * Math.PI;
  let value = 0;
  let amplitude = 0.5;
  let radius = 1;
  for (let octave = 0; octave < OCTAVES; octave++) {
    value +=
      amplitude *
      noise(
        Math.cos(a) * radius,
        Math.sin(a) * radius,
        Math.cos(b) * radius,
        Math.sin(b) * radius,
      );
    amplitude /= 2;
    radius *= 2;
  }
  return (value + 1) / 2;
}

export function fogTextureUrl(dark: string, light: string) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported");
  const image = context.createImageData(SIZE, SIZE);
  const noise = createNoise4D();
  const from = toRgba(dark);
  const to = toRgba(light);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = cloudiness(noise, x, y);
      const i = (y * SIZE + x) * 4;
      image.data[i] = from.r + (to.r - from.r) * t;
      image.data[i + 1] = from.g + (to.g - from.g) * t;
      image.data[i + 2] = from.b + (to.b - from.b) * t;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
