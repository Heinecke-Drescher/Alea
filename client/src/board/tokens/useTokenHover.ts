import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import Konva from "konva";
import type { Group } from "konva/lib/Group";
import type { Stage } from "konva/lib/Stage";
import type { IRect } from "konva/lib/types";
import { useEffect, useState, type RefObject } from "react";
import { TOOLTIP_DELAY } from "../../theme";
import { TOKEN_BODY_NAME, tokenIdAt } from "./tokenNodes";

const GROWN = 1.5;
const GROW_SECONDS = 0.12;
// Lets the pointer slip off a token for a moment, or reach the next one, without the card flickering.
const CLOSE_DELAY = 200;

export interface HoveredToken {
  id: string;
  rect: IRect;
}

// A token under the mouse grows at once and shows its details after a moment, like a tooltip.
// Only for a mouse, as a touch screen keeps the hover after a tap; and not while a button is down,
// so pressing, dragging and drawing areas show nothing.
export function useTokenHover(
  stageRef: RefObject<Stage | null>,
  isEnabled: boolean,
): HoveredToken | null {
  const canHover = useMediaQuery(
    "(hover: hover) and (pointer: fine)",
    undefined,
    { getInitialValueInEffect: false },
  );
  const reducesMotion = useReducedMotion(undefined, {
    getInitialValueInEffect: false,
  });
  const [shown, setShown] = useState<HoveredToken | null>(null);

  useEffect(() => {
    const mounted = stageRef.current;
    if (!mounted) throw new Error("Stage is not mounted");
    const stage = mounted;
    if (!isEnabled || !canHover) return;
    let hovered: string | null = null;
    let isOpen = false;
    let timer: number | undefined;
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

    function hover(next: string | null) {
      if (next === hovered) return;
      grow(hovered, 1);
      lower();
      grow(next, GROWN);
      if (next !== null) raise(next);
      hovered = next;
      window.clearTimeout(timer);
      if (next === null) {
        timer = window.setTimeout(() => {
          isOpen = false;
          setShown(null);
        }, CLOSE_DELAY);
        return;
      }
      // Moving on to the next token while a card is open shows its card as soon as the token has
      // grown, as the card is placed beside the grown token.
      const delay = isOpen
        ? reducesMotion
          ? 0
          : GROW_SECONDS * 1000
        : TOOLTIP_DELAY;
      timer = window.setTimeout(() => open(next), delay);
    }

    function open(id: string) {
      const card = cardFor(id);
      isOpen = card !== null;
      setShown(card);
    }

    function dismiss() {
      window.clearTimeout(timer);
      grow(hovered, 1);
      lower();
      hovered = null;
      isOpen = false;
      setShown(null);
    }

    stage.on("mousemove.tokenHover", (event) => {
      if (event.evt.buttons !== 0 || Konva.isDragging()) dismiss();
      else hover(tokenIdAt(event.target));
    });
    stage.on("mouseleave.tokenHover", () => hover(null));
    // The view moves under a wheel, so the card would no longer be beside its token.
    stage.on("mousedown.tokenHover wheel.tokenHover", dismiss);
    return () => {
      stage.off(".tokenHover");
      window.clearTimeout(timer);
      // Also takes over a growth still running, which would end large otherwise.
      grow(hovered, 1);
      lower();
      setShown(null);
    };
  }, [stageRef, isEnabled, canHover, reducesMotion]);

  return shown;
}
