import { isDieSides, type DieSides } from "../../../shared/dice";

const DIE_TYPE = "application/x-alea-die";

export function startDieDrag(dataTransfer: DataTransfer, sides: DieSides) {
  dataTransfer.setData(DIE_TYPE, String(sides));
  dataTransfer.effectAllowed = "copy";
}

export function isDieDrag(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes(DIE_TYPE);
}

// Anything can be dropped on the map, such as files or text, so only real dice count.
export function droppedDie(dataTransfer: DataTransfer): DieSides | null {
  const sides = Number(dataTransfer.getData(DIE_TYPE));
  return isDieSides(sides) ? sides : null;
}
