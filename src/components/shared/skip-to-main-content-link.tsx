import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

/**
 * The app shell's content area (`root-layout.tsx`) when the main interface is
 * mounted; gate screens (onboarding, API key entry, backend recovery,
 * bootstrap loading) render a single `<main>` instead.
 */
function findMainContent(): HTMLElement | null {
  return (
    document.getElementById("root-outlet") ?? document.querySelector("main")
  );
}

/**
 * WCAG 2.4.1 (Bypass Blocks) skip link. Focus is moved by hand, following the
 * GOV.UK Frontend skip link: a hash navigation would go through the router and
 * the target is not focusable on its own, so it gets a temporary
 * `tabindex="-1"` that is removed on blur to keep it out of the Tab order.
 */
export function SkipToMainContentLink() {
  const { t } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = findMainContent();
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener(
        "blur",
        () => target.removeAttribute("tabindex"),
        { once: true },
      );
    }
    target.focus();
  };

  return (
    <a
      href="#root-outlet"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-9999 rounded-md border border-border bg-base-secondary px-4 py-2 text-sm text-contrast focus-visible:outline-2 focus-visible:outline-focus"
    >
      {t(I18nKey.COMMON$SKIP_TO_MAIN_CONTENT)}
    </a>
  );
}
