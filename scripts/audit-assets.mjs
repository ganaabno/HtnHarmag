import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const result = { models: [], generatedAt: new Date().toISOString() };
for (const [original, optimized] of [
  [
    "sergeenee_surface_refined_repaired.glb",
    "sergeenee_surface_refined_repaired.glb",
  ],
  ["qn_black_wolfberry.glb", "wolfberry.glb"],
]) {
  const src = await readFile(new URL(`assets/${original}`, root));
  const dst = await readFile(
    new URL(`apps/web/public/models/${optimized}`, root),
  );
  if (
    dst.readUInt32LE(0) !== 0x46546c67 ||
    dst.readUInt32LE(4) !== 2 ||
    dst.readUInt32LE(8) !== dst.length
  )
    throw new Error(`Invalid GLB: ${optimized}`);
  const data = JSON.parse(dst.subarray(20, 20 + dst.readUInt32LE(12)));
  if (!data.images.every((i) => typeof i.bufferView === "number"))
    throw new Error("Expected embedded artwork");
  result.models.push({
    original,
    originalBytes: src.length,
    originalSha256: createHash("sha256").update(src).digest("hex"),
    optimized,
    optimizedBytes: dst.length,
    meshCount: data.meshes.length,
    materialCount: data.materials.length,
    embeddedImages: data.images.length,
    extensions: data.extensionsUsed,
  });
}
await writeFile(
  new URL("docs/ASSET_AUDIT.json", root),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
