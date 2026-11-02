import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
const failedResponses = [];
const captures = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.url().startsWith("http://127.0.0.1:4173") && r.status() >= 400)
    failedResponses.push([r.url(), r.status()]);
});
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);
await page.screenshot({ path: "../../docs/qa/home-desktop.png" });
const canvasCount = await page.locator("canvas").count();
const webgl = await page.locator("html").getAttribute("data-webgl");
for (const [name, y, selector] of [
  ["chapter-origin", 1300, ".chapter-berry"],
  ["chapter-transformation", 2400, ".chapter-product"],
  ["chapter-future", 3500, ".chapter-future"],
]) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForFunction(
    (selector) =>
      Number(getComputedStyle(document.querySelector(selector)).opacity) > 0.96,
    selector,
    { timeout: 20000 },
  );
  const opacity = await page
    .locator(selector)
    .evaluate((e) => getComputedStyle(e).opacity);
  await page.screenshot({ path: `../../docs/qa/${name}.png` });
  captures.push({ name, scroll: await page.evaluate(() => scrollY), opacity });
}
await page.locator("#collection").scrollIntoViewIfNeeded();
await page.waitForTimeout(1600);
await page.screenshot({ path: "../../docs/qa/collection-desktop.png" });
await page.getByRole("button", { name: "Дараагийн бүтээгдэхүүн" }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "../../docs/qa/collection-wolfberry.png" });
await page.goto("http://127.0.0.1:4173/products/sergeenee", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);
await page.screenshot({ path: "../../docs/qa/detail-desktop.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2300);
await page.screenshot({ path: "../../docs/qa/home-mobile.png" });
const mobileOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
const report = {
  productionURL: "http://127.0.0.1:4173",
  canvasCount,
  webgl,
  captures,
  mobileOverflow,
  errors,
  failedResponses,
};
await writeFile(
  "../../docs/qa/production-audit.json",
  JSON.stringify(report, null, 2),
);
await writeFile(
  "../../docs/qa/browser-errors.json",
  JSON.stringify(errors, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (
  errors.length ||
  failedResponses.length ||
  mobileOverflow ||
  canvasCount !== 1 ||
  captures.some((c) => Number(c.opacity) < 0.8)
)
  process.exitCode = 1;
