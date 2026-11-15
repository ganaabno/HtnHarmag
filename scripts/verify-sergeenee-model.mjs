import assert from "node:assert/strict";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { validateSergeeneeAsset } from "./validate-sergeenee-asset.mjs";

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const base = new URL("../", import.meta.url);
assert.deepEqual(
  await readFile(
    new URL("assets/sergeenee_surface_refined_repaired.glb", base),
  ),
  await readFile(
    new URL(
      "apps/web/public/models/sergeenee_surface_refined_repaired.glb",
      base,
    ),
  ),
  "Publish the exact independently verified GLB.",
);
for (const name of [
  "assets/sergeenee_surface_refined_repaired.glb",
  "apps/web/public/models/sergeenee_surface_refined_repaired.glb",
]) {
  const document = await io.read(fileURLToPath(new URL(name, base)));
  console.log(name, validateSergeeneeAsset(document));
}
if (process.argv[2]) {
  const bad = await io.read(process.argv[2]);
  assert.throws(
    () => validateSergeeneeAsset(bad),
    /Non-product object|evaluated pouch shape|15 current|dimensions|normal map/,
  );
  console.log("Regression check: rejected the original corrupt export.");
}
