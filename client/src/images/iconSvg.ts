// Images know no currentColor, and a larger intrinsic size keeps icons sharp
// when zoomed in.
export function coloredIconSvg(
  name: string,
  svg: string,
  color: string,
  size: number,
) {
  const width = /\swidth="24"/;
  const height = /\sheight="24"/;
  if (!width.test(svg) || !height.test(svg) || !svg.includes("currentColor")) {
    throw new Error(`Icon "${name}" has an unknown format`);
  }
  return svg
    .replaceAll("currentColor", color)
    .replace(width, ` width="${size}"`)
    .replace(height, ` height="${size}"`);
}

export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
