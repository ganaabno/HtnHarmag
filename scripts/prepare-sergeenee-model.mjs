import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateSergeeneeAsset } from "./validate-sergeenee-asset.mjs";

const base = new URL("../", import.meta.url);
const name = "sergeenee_surface_refined_repaired.glb";
const source = new URL(`assets/${name}`, base);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read(fileURLToPath(source));
console.log("Product-only preflight:", validateSergeeneeAsset(document));
// Publish the independently inspected export without changing vertices or textures.
await copyFile(source, new URL(`apps/web/public/models/${name}`, base));
console.log(
  "Published the verified refined pouch without further transformations.",
);
