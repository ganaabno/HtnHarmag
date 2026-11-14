import assert from "node:assert/strict";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { fileURLToPath } from "node:url";
import { validateSergeeneeAsset } from "./validate-sergeenee-asset.mjs";

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const base = new URL("../", import.meta.url);
for (const name of [
  "assets/sergeenee_product_FINAL.glb",
  "apps/web/public/models/sergeenee.glb",
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
