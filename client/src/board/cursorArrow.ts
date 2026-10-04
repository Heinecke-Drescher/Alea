export const CURSOR_ARROW = [0, 0, 0, 18, 5, 13, 13, 13];

const PADDING = 1;

export function cursorArrowCss(color: string) {
  const points = CURSOR_ARROW.map((value) => value + PADDING).join(" ");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="21">` +
    `<polygon points="${points}" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${PADDING} ${PADDING}, default`;
}
