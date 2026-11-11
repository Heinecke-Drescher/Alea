import { useReducedMotion } from "@mantine/hooks";
import Konva from "konva";
import type { Group } from "konva/lib/Group";
import type { Stage } from "konva/lib/Stage";
import type { IRect } from "konva/lib/types";
import { useEffect, useState, type RefObject } from "react";
import { createHoverIntent } from "../../hoverIntent";
import { TOKEN_BODY_NAME, tokenIdAt } from "./tokenNodes";

const GROWN = 1.5;
const GROW_SECONDS = 0.12;

export interface HoveredToken {
  id: string;
  rect: IRect;
}

// A token under the mouse grows at once and shows its details after a moment, like a tooltip.
// Only for a mouse, and not while a button is down, so pressing, dragging and drawing areas show
// nothing.
export function useTokenHover(
  stageRef: RefObject<Stage | null>,
  isEnabled: boolean,
): HoveredToken | null {
  const reducesMotion = useReducedMotion(undefined, {
    getInitialValueInEffect: false,
  });
  const [shown, setShown] = useState<HoveredToken | null>(null);

  useEffect(() => {
    const mounted = stageRef.current;
    if (!mounted) throw new Error("Stage is not mounted");
    const stage = mounted;
    if (!isEnabled) return;
    let hovered: string | null = null;
    // React keeps the tokens in its own order, and react-konva inserts new ones by the current
    // order of the nodes, so a raised token goes back to its place as soon as it is left.
    let raised: { token: Group; index: number } | null = null;

    // The token may have been removed meanwhile.
    function tokenOf(id: string) {
      return stage.findOne<Group>(`#${id}`) ?? null;
    }

    function bodyOf(id: string) {
      return tokenOf(id)?.findOne(`.${TOKEN_BODY_NAME}`) ?? null;
    }

    function grow(id: string | null, scale: number) {
      const body = id === null ? null : bodyOf(id);
      if (!body) return;
      if (reducesMotion) body.scale({ x: scale, y: scale });
      else body.to({ scaleX: scale, scaleY: scale, duration: GROW_SECONDS });
    }

    function raise(id: string) {
      const token = tokenOf(id);
      if (!token) return;
      raised = { token, index: token.zIndex() };
      token.moveToTop();
    }

    function lower() {
      if (!raised) return;
      const { token, index } = raised;
      raised = null;
      const siblings = token.getParent()?.getChildren();
      if (!siblings) return;
      token.zIndex(Math.min(index, siblings.length - 1));
    }

    function cardFor(id: string): HoveredToken | null {
      const body = bodyOf(id);
      return body ? { id, rect: body.getClientRect() } : null;
    }

    // Moving on to the next token while a card is open shows its card as soon as the token has
    // grown, as the card is placed beside the grown token.
    const intent = createHoverIntent(
      (id: string) => {
        const card = cardFor(id);
        setShown(card);
        return card !== null;
      },
      () => setShown(null),
      reducesMotion ? 0 : GROW_SECONDS * 1000,
    );

    function hover(next: string | null) {
      if (next === hovered) return;
      grow(hovered, 1);
      lower();
      grow(next, GROWN);
      if (next !== null) raise(next);
      hovered = next;
      intent.hover(next);
    }

    function dismiss() {
      grow(hovered, 1);
      lower();
      hovered = null;
      intent.cancel();
    }

    // Asks every event, like usePointerRaise, as some phones claim a mouse in their media queries.
    stage.on("pointermove.tokenHover", (event) => {
      if (event.evt.pointerType !== "mouse") return;
      if (event.evt.buttons !== 0 || Konva.isDragging()) dismiss();
      else hover(tokenIdAt(event.target));
    });
    stage.on("pointerleave.tokenHover", () => hover(null));
    // The view moves under a wheel, so the card would no longer be beside its token.
    stage.on("pointerdown.tokenHover wheel.tokenHover", dismiss);
    return () => {
      stage.off(".tokenHover");
      intent.stop();
      // Also takes over a growth still running, which would end large otherwise.
      grow(hovered, 1);
      lower();
      setShown(null);
    };
  }, [stageRef, isEnabled, reducesMotion]);

  return shown;
}
