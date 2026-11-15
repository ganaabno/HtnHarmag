import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "../../apps/web/node_modules/@playwright/test/index.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const library = path.resolve("C:/Users/77/dev/blender/glb_repair");
const out = path.resolve("C:/Users/77/dev/blender/refined_glb_repair");
const evidence = path.join(repo, "docs/qa/refined-repair");
const { validateBytes } = createRequire(path.join(library, "package.json"))(
  "gltf-validator",
);
const phase = process.argv[2] ?? "isolation";
const assets =
  phase === "isolation"
    ? ["isolation_red", "isolation_original_materials"]
    : ["sergeenee_surface_refined_repaired"];
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    const relative = decodeURIComponent(u.pathname).slice(1);
    let file = relative.endsWith(".glb")
      ? path.resolve(out, relative)
      : path.resolve(library, relative);
    if (
      !file.startsWith(out + path.sep) &&
      !file.startsWith(library + path.sep)
    )
      throw Error("Invalid path");
    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".glb": "model/gltf-binary",
    };
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(await fs.readFile(file));
  } catch (e) {
    res.writeHead(404).end(String(e));
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const browser = await chromium.launch({
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const report = {};
try {
  for (const asset of assets) {
    report[asset] = {
      validator: await validateBytes(
        new Uint8Array(await fs.readFile(path.join(out, asset + ".glb"))),
        { uri: asset + ".glb", maxIssues: 100 },
      ),
    };
    for (const engine of ["three", "babylon"]) {
      const page = await browser.newPage({
          viewport: { width: 900, height: 1000 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(
        `http://127.0.0.1:${port}/${engine === "three" ? "three-viewer.html" : "viewer.html"}?asset=${asset}.glb`,
      );
      await page.waitForFunction(() => window.ready || window.failure, null, {
        timeout: 90000,
      });
      const failure = await page.evaluate(() => window.failure);
      if (failure) throw Error(failure);
      report[asset][engine] = {
        ...(await page.evaluate(() => window.audit)),
        errors,
      };
      // Capture one deterministic frame; continuous software rendering can starve screenshots.
      if (engine === "babylon")
        await page.evaluate(() => window.eval("engine.stopRenderLoop()"));
      for (const view of ["front", "back", "side", "hero"]) {
        await page.evaluate((v) => window.setView(v), view);
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(evidence, `${asset}_${engine}_${view}.png`),
          timeout: 90000,
        });
      }
      await page.close();
      if (errors.length) throw Error(errors.join("\n"));
      await fs.writeFile(
        path.join(evidence, phase + "_viewers.json"),
        JSON.stringify(report, null, 2),
      );
    }
    console.log(
      asset,
      JSON.stringify({
        errors: report[asset].validator.issues.numErrors,
        warnings: report[asset].validator.issues.numWarnings,
        three: report[asset].three,
      }),
    );
  }
  await fs.writeFile(
    path.join(evidence, phase + "_viewers.json"),
    JSON.stringify(report, null, 2),
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
