import { useLocalStorage } from "@mantine/hooks";
import { nanoid } from "nanoid";
import { useState } from "react";
import { defaultPlayerColor, isPlayerColor } from "../room/playerColors";
import { randomPlayerName } from "./randomPlayerName";

const PLAYER_ID_KEY = "alea-player-id";
const PLAYER_NAME_KEY = "alea-player-name";

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
  const [isNameMissing] = useState(
    () => localStorage.getItem(PLAYER_NAME_KEY) === null,
  );
  const [assignedName] = useState(randomPlayerName);
  // Mantine stores the default on mount, so the assigned name stays the same in every room.
  const [name, setStoredName] = useLocalStorage({
    key: PLAYER_NAME_KEY,
    defaultValue: assignedName,
    getInitialValueInEffect: false,
  });
  const [isNameAssigned, setNameAssigned] = useLocalStorage({
    key: "alea-player-name-assigned",
    defaultValue: isNameMissing,
    getInitialValueInEffect: false,
  });
  const [storedColor, setColor] = useLocalStorage({
    key: "alea-player-color",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const pickedColor = isPlayerColor(storedColor) ? storedColor : null;
  const color = pickedColor ?? defaultPlayerColor(name);

  function setName(newName: string) {
    setStoredName(newName);
    setNameAssigned(false);
  }

  return {
    id,
    name,
    color,
    pickedColor,
    setName,
    setColor,
    isNameAssigned,
    keepAssignedName: () => setNameAssigned(false),
  };
}
