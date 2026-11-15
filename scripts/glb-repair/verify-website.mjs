import { chromium } from "../../apps/web/node_modules/@playwright/test/index.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174";
const name = "sergeenee_surface_refined_repaired.glb";
const source = await readFile(new URL(`../../assets/${name}`, import.meta.url));
const browser = await chromium.launch();
const report = {};
try {
  for (const [view, route] of [
    ["home", "/"],
    ["product", "/products/sergeenee"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const model = page.waitForResponse((r) =>
      r.url().endsWith("/models/" + name),
    );
    await page.goto(base + route);
    const response = await model;
    const served = await page.request.get(response.url());
    if (!response.ok() || !(await served.body()).equals(source))
      throw Error("Website is serving the wrong model");
    if (view === "product")
      await page
        .locator(".product-view.model-ready")
        .waitFor({ timeout: 30000 });
    else await page.waitForTimeout(2500);
    await page.screenshot({
      path: new URL(
        `../../docs/qa/refined-repair/website_${view}.png`,
        import.meta.url,
      ).pathname.replace(/^\/([A-Z]:)/, "$1"),
    });
    report[view] = {
      url: response.url(),
      bytes: source.length,
      sha256: createHash("sha256").update(source).digest("hex"),
      errors,
    };
    if (errors.length) throw Error(errors.join("\n"));
    await page.close();
  }
  await writeFile(
    new URL("../../docs/qa/refined-repair/website.json", import.meta.url),
    JSON.stringify(report, null, 2),
  );
  console.log(
    "Home and product page serve the independently verified GLB byte-for-byte; no browser errors.",
  );
} finally {
  await browser.close();
}
