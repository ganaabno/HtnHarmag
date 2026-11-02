import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const directory = "../../docs/qa";
await mkdir(directory, { recursive: true }).catch((e) => {
  if (e.code !== "EEXIST") throw e;
});
const browser = await chromium.launch({ headless: true });
const report = { errors: [], viewports: [] };
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 960],
    ["tablet", 820, 1180],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (e) => report.errors.push(`${name}: ${e.message}`));
    const requests = [];
    page.on("response", (r) => {
      if (r.url().endsWith(".glb"))
        requests.push({ url: r.url(), status: r.status() });
    });
    await page.goto("http://127.0.0.1:5174/", {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".sg-ready").waitFor({ timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${directory}/sergeenee-${name}-hero.png` });
    await page
      .locator("#collection")
      .evaluate((e) =>
        window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY),
      );
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `${directory}/sergeenee-${name}-collection.png`,
    });
    await page.getByRole("button", { name: "Дараах бүтээгдэхүүн" }).click();
    await page
      .getByRole("heading", { name: "Чонон Хармаг", exact: true })
      .waitFor();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${directory}/sergeenee-${name}-wolfberry.png`,
    });
    const inspection = page.locator(".sg-inspect");
    await inspection.focus();
    const before = await inspection.getAttribute("data-yaw");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(600);
    const after = await inspection.getAttribute("data-yaw");
    report.viewports.push({
      name,
      width,
      height,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      canvases: await page.locator("canvas").count(),
      requests,
      inspection: { before, after },
      reducedMotionPins: await page.locator(".pin-spacer .sg-dive").count(),
    });
    await page.close();
  }
  await writeFile(
    `${directory}/sergeenee-audit.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
