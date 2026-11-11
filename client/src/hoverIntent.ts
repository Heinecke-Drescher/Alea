import { TOOLTIP_DELAY } from "./theme";

// Lets the pointer slip off for a moment, or reach the next item, without the card flickering.
const CLOSE_DELAY = 200;

// Shows a card for what the mouse rests on, like a tooltip: after a moment, and when a card is
// already open, the next item's card after `switchDelay`. `show` tells whether it could show one.
export function createHoverIntent<T>(
  show: (item: T) => boolean,
  hide: () => void,
  switchDelay = 0,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isOpen = false;

  function hover(item: T | null) {
    clearTimeout(timer);
    if (item === null) {
      timer = setTimeout(() => {
        isOpen = false;
        hide();
      }, CLOSE_DELAY);
      return;
    }
    timer = setTimeout(
      () => {
        isOpen = show(item);
      },
      isOpen ? switchDelay : TOOLTIP_DELAY,
    );
  }

  function cancel() {
    clearTimeout(timer);
    isOpen = false;
    hide();
  }

  // For unmounting, when nothing may be shown or hidden any more.
  function stop() {
    clearTimeout(timer);
  }

  return { hover, cancel, stop };
}
