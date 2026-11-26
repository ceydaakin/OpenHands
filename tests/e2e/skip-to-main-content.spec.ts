import { expect, test } from "@playwright/test";

test("Tab reveals the skip link and Enter moves focus to the main content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("analytics-consent", "false");
    localStorage.setItem("openhands-telemetry-consent", "denied");
    localStorage.setItem("openhands-telemetry-first-use", "true");
    localStorage.setItem("openhands-onboarded", "1");
    localStorage.setItem(
      "openhands-backends",
      JSON.stringify([
        {
          id: "default-local",
          name: "Local",
          host: window.location.origin,
          apiKey: "",
          kind: "local",
        },
      ]),
    );
    localStorage.setItem(
      "openhands-active-backend",
      JSON.stringify({ backendId: "default-local", orgId: null }),
    );
  });
  await page.route(/posthog|z\.openhands\.dev/, (route) => route.abort());
  // Home autofocuses the composer, so use a page that starts with nothing
  // focused, as a keyboard user lands on after a fresh load.
  await page.goto("/settings/app");
  await expect(page.getByTestId("root-layout")).toBeVisible();
  // Local mock settings may still have null server-side consent even when
  // browser storage is seeded. Dismiss that modal without enabling tracking,
  // then reload so the check starts from a fresh page with nothing focused.
  const consent = page.getByTestId("telemetry-consent-form");
  const hasConsentPrompt = await consent
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(
      () => true,
      () => false,
    );
  if (hasConsentPrompt) {
    await consent.getByRole("checkbox").uncheck();
    await consent.getByTestId("confirm-telemetry-preferences").click();
    await expect(consent).toBeHidden();
    await page.reload();
    await expect(page.getByTestId("root-layout")).toBeVisible();
  }

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).not.toBeInViewport();

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  const content = page.locator("#root-outlet");
  await expect(content).toBeFocused();

  // The next Tab stays inside the content area instead of the sidebar.
  await page.keyboard.press("Tab");
  expect(
    await content.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
});
