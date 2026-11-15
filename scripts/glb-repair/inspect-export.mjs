import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const report = {};
for (const file of [
  "sergeenee_surface_refined.glb",
  "sergeenee_surface_refined_repaired.glb",
]) {
  const bytes = await readFile(
    new URL(`../../assets/${file}`, import.meta.url),
  );
  const jsonLength = bytes.readUInt32LE(12);
  const j = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const binary = bytes.subarray(20 + jsonLength + 8);
  const imageFor = (t) =>
    t ? j.images[j.textures[t.index].source]?.name : null;
  const images = [];
  for (const image of j.images) {
    const view = j.bufferViews[image.bufferView];
    const { data, info } = await sharp(
      binary.subarray(
        view.byteOffset ?? 0,
        (view.byteOffset ?? 0) + view.byteLength,
      ),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let grayscale = true,
      transparent = 0,
      transparentBlack = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2])
        grayscale = false;
      if (data[i + 3] === 0) {
        transparent++;
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0)
          transparentBlack++;
      }
    }
    images.push({
      name: image.name,
      embedded: typeof image.bufferView === "number",
      width: info.width,
      height: info.height,
      grayscale,
      transparentPixels: transparent,
      transparentBlackPixels: transparentBlack,
    });
  }
  report[file] = {
    nodes: j.nodes.map((n) => n.name),
    meshes: j.meshes.length,
    primitives: j.meshes.flatMap((m) =>
      m.primitives.map((p) => ({
        mesh: m.name,
        material: j.materials[p.material].name,
        attributes: Object.keys(p.attributes),
        morphTargets: p.targets?.length ?? 0,
      })),
    ),
    materials: j.materials.map((m) => ({
      name: m.name,
      alphaMode: m.alphaMode ?? "OPAQUE",
      doubleSided: m.doubleSided ?? false,
      baseColorImage: imageFor(m.pbrMetallicRoughness?.baseColorTexture),
      normalImage: imageFor(m.normalTexture),
      metallicRoughnessImage: imageFor(
        m.pbrMetallicRoughness?.metallicRoughnessTexture,
      ),
      pbr: m.pbrMetallicRoughness,
      extensions: m.extensions,
    })),
    images,
  };
}
await writeFile(
  new URL(
    "../../docs/qa/refined-repair/export-inspection.json",
    import.meta.url,
  ),
  JSON.stringify(report, null, 2),
);
console.log(
  "Saved material, primitive, alpha, embedded-image and grayscale-normal evidence.",
);
