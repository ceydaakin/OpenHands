import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkipToMainContentLink } from "#/components/shared/skip-to-main-content-link";

describe("SkipToMainContentLink", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is the first focusable element and uses the i18n key", () => {
    render(
      <>
        <SkipToMainContentLink />
        <nav>
          <button type="button">Sidebar</button>
        </nav>
      </>,
    );

    const link = screen.getByRole("link", {
      name: "COMMON$SKIP_TO_MAIN_CONTENT",
    });
    expect(document.querySelector("a, button")).toBe(link);
    expect(link).toHaveClass("sr-only", "focus:not-sr-only");
  });

  it("moves focus into the app shell content area", () => {
    render(
      <>
        <SkipToMainContentLink />
        <nav>
          <button type="button">Sidebar</button>
        </nav>
        <div id="root-outlet">
          <main>
            <button type="button">Content</button>
          </main>
        </div>
      </>,
    );

    fireEvent.click(
      screen.getByRole("link", { name: "COMMON$SKIP_TO_MAIN_CONTENT" }),
    );

    const outlet = document.getElementById("root-outlet")!;
    expect(outlet).toHaveFocus();
    expect(outlet).toHaveAttribute("tabindex", "-1");

    // The temporary tabindex must not leave the area in the Tab order.
    fireEvent.blur(outlet);
    expect(outlet).not.toHaveAttribute("tabindex");
  });

  it("falls back to the <main> landmark on gate screens", () => {
    render(
      <>
        <SkipToMainContentLink />
        <main data-testid="gate">
          <button type="button">Continue</button>
        </main>
      </>,
    );

    fireEvent.click(
      screen.getByRole("link", { name: "COMMON$SKIP_TO_MAIN_CONTENT" }),
    );

    expect(screen.getByTestId("gate")).toHaveFocus();
  });
});
