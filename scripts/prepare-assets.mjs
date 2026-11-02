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
import { mkdir, copyFile, writeFile } from "node:fs/promises";
const base = new URL("../", import.meta.url);
const dir = (s) => new URL(s, base);
for (const d of ["models", "images", "documents"])
  await mkdir(dir(`apps/web/public/${d}`), { recursive: true });
for (const [source, name] of [
  ["sergeenee_product_FINAL.glb", "sergeenee.glb"],
  ["qn_black_wolfberry.glb", "wolfberry.glb"],
]) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const doc = await io.read(
    dir(`assets/${source}`).pathname.replace(/^\/([A-Z]:)/, "$1"),
  );
  await MeshoptEncoder.ready;
  await doc.transform(
    dedup(),
    prune(),
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [2048, 2048],
      quality: 88,
    }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
  await io.write(
    dir(`apps/web/public/models/${name}`).pathname.replace(/^\/([A-Z]:)/, "$1"),
    doc,
  );
  console.log("Optimized", name);
}
await sharp(fileURLToPath(dir("assets/2.png")))
  .resize(220)
  .png()
  .toFile(fileURLToPath(dir("apps/web/public/images/logo.png")));
await sharp(fileURLToPath(dir("assets/3.png")))
  .resize(380)
  .png()
  .toFile(fileURLToPath(dir("apps/web/public/images/logo-line.png")));
for (const name of ["Сэргээнээ гоёо танилцуулга.pdf", "ХХКХХ22.pdf"])
  await copyFile(
    dir(`assets/${name}`),
    dir(`apps/web/public/documents/${name}`),
  );
await writeFile(dir("apps/web/public/robots.txt"), "User-agent: *\nAllow: /\n");
