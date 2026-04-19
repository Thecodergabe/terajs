import { describe, expect, it, vi } from "vitest";
import { attachIframeAreaEventBridge } from "./render.js";

describe("attachIframeAreaEventBridge", () => {
  it("forwards click, input, and change events from the iframe document", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const click = vi.fn();
    const input = vi.fn();
    const change = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click,
      input,
      change,
    });

    const button = frameDocument.createElement("button");
    button.textContent = "warn";
    frameDocument.body.appendChild(button);
    button.click();

    const slider = frameDocument.createElement("input");
    slider.value = "5";
    frameDocument.body.appendChild(slider);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("replaces previous iframe listeners instead of stacking duplicates", () => {
    const frameDocument = document.implementation.createHTMLDocument("iframe-host");
    const firstClick = vi.fn();
    const secondClick = vi.fn();
    const noop = vi.fn();

    attachIframeAreaEventBridge(frameDocument, {
      click: firstClick,
      input: noop,
      change: noop,
    });

    attachIframeAreaEventBridge(frameDocument, {
      click: secondClick,
      input: noop,
      change: noop,
    });

    const button = frameDocument.createElement("button");
    frameDocument.body.appendChild(button);
    button.click();

    expect(firstClick).toHaveBeenCalledTimes(0);
    expect(secondClick).toHaveBeenCalledTimes(1);
  });
});