import { useState, type PointerEvent } from "react";

// Whether something is raised: a mouse resting on it, or, with `raisesOnPress`, a finger or pen
// holding it. Asks every event what it comes from instead of the device's (hover: hover) media
// query, which some phones, e.g. Samsung's, answer as if they had a mouse, so a tapped item
// would stay raised.
export function usePointerRaise(raisesOnPress: boolean) {
  const [isRaised, setRaised] = useState(false);
  const isMouse = (event: PointerEvent) => event.pointerType === "mouse";

  return {
    isRaised,
    handlers: {
      onPointerEnter(event: PointerEvent) {
        if (isMouse(event)) setRaised(true);
      },
      onPointerDown(event: PointerEvent) {
        if (raisesOnPress && !isMouse(event)) setRaised(true);
      },
      onPointerUp(event: PointerEvent) {
        if (!isMouse(event)) setRaised(false);
      },
      onPointerCancel() {
        setRaised(false);
      },
      onPointerLeave() {
        setRaised(false);
      },
    },
  };
}
