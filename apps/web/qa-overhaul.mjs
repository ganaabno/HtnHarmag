/* global window, document, scrollY, innerWidth, console */
import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const report = [];
const base = "http://127.0.0.1:5175";
for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: width < 800,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.heroReady === 'true', {timeout: 30000});
  await page.waitForTimeout(3000);
  const capture = async (name) =>
    page.screenshot({ path: `../../docs/qa/final-${name}-${width}.png` });
  await capture("hero");
  const hero = page.locator(".hero-inspection");
  const initial = Number(await hero.getAttribute("data-yaw"));
  await hero.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(450);
  const rotated = Number(await hero.getAttribute("data-yaw"));
  const entry = {
    width,
    height,
    errors,
    heroKeyboardRotation: rotated > initial,
    webgl: await page.locator("html").getAttribute("data-webgl"),
  };
  for (const [name, progress] of [
    ["origin", 0.31],
    ["product", 0.62],
    ["impact", 0.93],
  ]) {
    await page.evaluate((y) => window.scrollTo(0, y), height * 3.6 * progress);
    await page.waitForTimeout(950);
    await capture(name);
  }
  await page
    .locator("#collection")
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 105),
    );
  await page.waitForTimeout(1400);
  await capture("collection");
  const view = page.locator(".collection .product-view");
  await expect(view).toHaveClass(/model-ready/, {timeout: 30000});
  await expect(view).toHaveAttribute('data-interaction-state', 'IDLE', {timeout: 15000});
  await view.focus();
  const before = Number(await view.getAttribute("data-yaw"));
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await view.getAttribute('data-yaw')), {timeout: 10000}).toBeGreaterThan(before);
  entry.collectionRotation =
    Number(await view.getAttribute("data-yaw")) > before;
  await page.locator(".collection-inspection-tools button").last().click();
  await page.waitForTimeout(550);
  entry.fullscreen =
    (await page.locator(".collection-fullscreen").count()) === 1;
  await page.keyboard.press("Escape");
  entry.fullscreenEscape =
    (await page.locator(".collection-fullscreen").count()) === 0;
  await page.locator(".collection-tabs button").nth(1).click();
  await page.waitForTimeout(1600);
  await page
    .locator(".collection-visual")
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 105),
    );
  await page.waitForTimeout(500);
  await capture("wolfberry");
  await page
    .locator(".closing-chapter")
    .evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 85),
    );
  await page.waitForTimeout(1500);
  await capture("footer");
  entry.noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  );
  await page.locator(".footer-signature").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await capture("wordmark");
  report.push(entry);
  console.log(JSON.stringify(entry));
  await page.close();
}
await writeFile(
  "../../docs/qa/creative-overhaul-report.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
