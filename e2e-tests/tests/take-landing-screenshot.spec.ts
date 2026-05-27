import { test } from "@playwright/test";

test("capture landing hero screenshot", async ({ page }) => {
  test.setTimeout(180_000);

  page.on("pageerror", (err) => {
    console.log(`[browser ERROR]`, err.message);
  });

  await page.setViewportSize({ width: 1440, height: 900 });

  // Pre-seed React Refresh globals BEFORE Vite plugin-react's preamble check runs.
  // Without this Playwright's Chromium throws "@vitejs/plugin-react can't detect preamble".
  await page.addInitScript(() => {
    (window as any).$RefreshReg$ = () => {};
    (window as any).$RefreshSig$ = () => (type: unknown) => type;
    (window as any).__vite_plugin_react_preamble_installed__ = true;
    window.localStorage.setItem("color-theme", JSON.stringify("dark"));
  });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  // Wait for the React landing to mount (anything substantive in #root).
  await page.waitForFunction(
    () => {
      const r = document.getElementById("root");
      return !!r && (r.textContent?.length ?? 0) > 200;
    },
    { timeout: 90_000 },
  );

  await page.addStyleTag({
    content: `
      #cc-main, #cc-container, .cm--cloud, [class*="cm__"] { display: none !important; }
    `,
  });

  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.style) {
        if (el.style.opacity === "0") el.style.opacity = "1";
        if (el.style.transform && el.style.transform !== "none") el.style.transform = "none";
        if (el.style.filter && el.style.filter.includes("blur")) el.style.filter = "none";
      }
    });
  });

  await page.waitForTimeout(1500);

  await page.screenshot({
    path: "../screenshots/landing.png",
    fullPage: false,
  });
});
