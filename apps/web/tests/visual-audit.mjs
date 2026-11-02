import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("../../docs/qa", { recursive: true }).catch((e) => {
  if (e.code !== "EEXIST") throw e;
});
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://127.0.0.1:5173/", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(4500);
await page.screenshot({ path: "../../docs/qa/home-desktop.png" });
console.log(
  "TITLE",
  await page.title(),
  "WEBGL",
  await page.locator("html").getAttribute("data-webgl"),
  "CANVASES",
  await page.locator("canvas").count(),
);
await page.locator("#collection").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.screenshot({ path: "../../docs/qa/collection-desktop.png" });
await page.goto("http://127.0.0.1:5173/products/sergeenee", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(2500);
await page.screenshot({ path: "../../docs/qa/detail-desktop.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: "../../docs/qa/home-mobile.png" });
await writeFile(
  "../../docs/qa/browser-errors.json",
  JSON.stringify(errors, null, 2),
);
console.log("ERRORS", JSON.stringify(errors));
await browser.close();
