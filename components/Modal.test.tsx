// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { Modal } from "./Modal";

afterEach(cleanup);

function renderModal(onClose: () => void) {
  return render(
    <Modal title="Test modal" onClose={onClose}>
      <button>First</button>
      <button>Second</button>
    </Modal>
  );
}

describe("Modal dialog semantics", () => {
  it("exposes role=dialog with aria-modal and an accessible name", () => {
    const { container } = renderModal(vi.fn());
    const card = container.querySelector('[role="dialog"]');
    expect(card?.getAttribute("aria-modal")).toBe("true");
    expect(card?.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("moves focus inside the dialog on open", () => {
    const { container } = renderModal(vi.fn());
    const card = container.querySelector('[role="dialog"]');
    expect(card?.contains(document.activeElement)).toBe(true);
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on overlay click but not on a click inside the card", () => {
    const onClose = vi.fn();
    const { container } = renderModal(onClose);
    const overlay = container.firstElementChild as HTMLElement;
    const card = container.querySelector('[role="dialog"]') as HTMLElement;

    fireEvent.click(card);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab focus within the dialog, wrapping in both directions", () => {
    const { container } = renderModal(vi.fn());
    const card = container.querySelector('[role="dialog"]') as HTMLElement;
    const buttons = Array.from(card.querySelectorAll("button"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("returns focus to the trigger element on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = renderModal(vi.fn());
    expect(document.activeElement).not.toBe(trigger);

    unmount();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });
});
