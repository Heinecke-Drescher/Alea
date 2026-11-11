import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHoverIntent } from "./hoverIntent";
import { TOOLTIP_DELAY } from "./theme";

describe("createHoverIntent", () => {
  let shown: string | null;
  const show = (item: string) => {
    shown = item;
    return true;
  };
  const hide = () => {
    shown = null;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    shown = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a card only after the mouse rested a moment", () => {
    const intent = createHoverIntent(show, hide);
    intent.hover("orc");
    vi.advanceTimersByTime(TOOLTIP_DELAY - 1);
    expect(shown).toBeNull();
    vi.advanceTimersByTime(1);
    expect(shown).toBe("orc");
  });

  it("shows nothing when the mouse only passes over", () => {
    const intent = createHoverIntent(show, hide);
    intent.hover("orc");
    intent.hover(null);
    vi.advanceTimersByTime(TOOLTIP_DELAY);
    expect(shown).toBeNull();
  });

  it("keeps the card a moment after the mouse left", () => {
    const intent = createHoverIntent(show, hide);
    intent.hover("orc");
    vi.advanceTimersByTime(TOOLTIP_DELAY);
    intent.hover(null);
    vi.advanceTimersByTime(100);
    expect(shown).toBe("orc");
    vi.advanceTimersByTime(100);
    expect(shown).toBeNull();
  });

  it("switches to the next item's card without the full wait", () => {
    const intent = createHoverIntent(show, hide, 120);
    intent.hover("orc");
    vi.advanceTimersByTime(TOOLTIP_DELAY);
    intent.hover(null);
    intent.hover("elf");
    vi.advanceTimersByTime(120);
    expect(shown).toBe("elf");
  });

  it("waits again when the last card could not be shown", () => {
    const intent = createHoverIntent(
      (item: string) => item !== "gone" && show(item),
      hide,
      120,
    );
    intent.hover("gone");
    vi.advanceTimersByTime(TOOLTIP_DELAY);
    intent.hover("orc");
    vi.advanceTimersByTime(120);
    expect(shown).toBeNull();
    vi.advanceTimersByTime(TOOLTIP_DELAY - 120);
    expect(shown).toBe("orc");
  });

  it("hides at once when cancelled", () => {
    const intent = createHoverIntent(show, hide);
    intent.hover("orc");
    vi.advanceTimersByTime(TOOLTIP_DELAY);
    intent.cancel();
    expect(shown).toBeNull();
    intent.hover("elf");
    vi.advanceTimersByTime(0);
    expect(shown).toBeNull();
  });
});
