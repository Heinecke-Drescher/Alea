import { useLocalStorage } from "@mantine/hooks";
import { nanoid } from "nanoid";
import { useState } from "react";
import { defaultPlayerColor, isPlayerColor } from "../room/playerColors";

const PLAYER_ID_KEY = "alea-player-id";

// Names can change or repeat, so the DM role is tied to this id kept in the browser.
function localPlayerId() {
  const stored = localStorage.getItem(PLAYER_ID_KEY);
  if (stored) return stored;
  const id = nanoid();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

export function useLocalPlayer() {
  const [id] = useState(localPlayerId);
  const [name, setName] = useLocalStorage({
    key: "alea-player-name",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const [storedColor, setColor] = useLocalStorage({
    key: "alea-player-color",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const pickedColor = isPlayerColor(storedColor) ? storedColor : null;
  const color = pickedColor ?? defaultPlayerColor(name);

  return { id, name, color, pickedColor, setName, setColor };
}
