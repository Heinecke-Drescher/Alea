import { nanoid } from "nanoid";
import { rollDie, type DieSides } from "../../../shared/dice";

export interface SecretRoll {
  id: string;
  sides: DieSides;
  value: number;
  at: Date;
}

export function rollSecretly(sides: DieSides): SecretRoll {
  return { id: nanoid(), sides, value: rollDie(sides), at: new Date() };
}
