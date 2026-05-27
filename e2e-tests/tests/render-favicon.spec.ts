import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

test("render favicon.svg to 32x32 png", async ({ page }) => {
  const svgPath = path.resolve(__dirname, "../../app/public/favicon.svg");
  const svg = fs.readFileSync(svgPath, "utf8");

  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;}svg{display:block;width:32px;height:32px;}</style></head><body>${svg}</body></html>`;

  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(html, { waitUntil: "load" });

  const out = path.resolve(__dirname, "../../app/public/favicon.png");
  const ico = path.resolve(__dirname, "../../app/public/favicon.ico");

  const buffer = await page.screenshot({ omitBackground: true, type: "png", fullPage: false });
  fs.writeFileSync(out, buffer);
  // ICO containers also accept a single PNG payload in modern browsers' rendering.
  // Keeping a .ico copy so legacy fallback link continues to resolve.
  fs.writeFileSync(ico, buffer);
});
