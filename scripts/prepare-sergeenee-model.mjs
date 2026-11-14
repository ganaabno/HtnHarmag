import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  textureCompress,
  meshopt,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { validateSergeeneeAsset } from "./validate-sergeenee-asset.mjs";

const base = new URL("../", import.meta.url);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.read(
  fileURLToPath(new URL("assets/sergeenee_product_FINAL.glb", base)),
);
console.log("Product-only preflight:", validateSergeeneeAsset(document));
await MeshoptEncoder.ready;
await document.transform(
  dedup(),
  prune(),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    quality: 88,
    resize: [2048, 2048],
    slots: /^(?!normalTexture).*$/,
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    lossless: true,
    slots: /^normalTexture$/,
  }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);
await io.write(
  fileURLToPath(new URL("apps/web/public/models/sergeenee.glb", base)),
  document,
);
console.log("Updated only the verified pouch asset.");
