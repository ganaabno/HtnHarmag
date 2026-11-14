import assert from "node:assert/strict";
import { getBounds } from "@gltf-transform/functions";

/** Fail before optimizing an accidental studio-scene or unbaked-shader export. */
export function validateSergeeneeAsset(document) {
  const root = document.getRoot();
  const scene = root.getDefaultScene();
  assert(scene, "Pouch GLB requires a default scene.");
  for (const node of root.listNodes()) {
    assert(
      !/floor|BEFORE_SHAPE|reference|artwork_master|copy_and_symbols/i.test(
        node.getName(),
      ),
      `Non-product object in pouch export: ${node.getName()}`,
    );
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      assert.equal(
        primitive.listTargets().length,
        0,
        "Freeze the current evaluated pouch shape before export.",
      );
      assert(
        primitive.getAttribute("NORMAL"),
        "Pouch primitive is missing normals.",
      );
      assert(
        primitive.getAttribute("TEXCOORD_0"),
        "Pouch primitive is missing artwork UVs.",
      );
    }
  }
  assert.equal(
    root.listMeshes().length,
    15,
    "Expected only the 15 current product meshes.",
  );
  const { min, max } = getBounds(scene);
  const dimensions = max.map((v, i) => v - min[i]);
  assert(
    dimensions[0] > 0.05 &&
      dimensions[0] < 0.2 &&
      dimensions[1] > 0.15 &&
      dimensions[1] < 0.3 &&
      dimensions[2] > 0.01 &&
      dimensions[2] < 0.1,
    `Unexpected pouch dimensions in meters: ${dimensions}. Exclude the studio floor and preserve product scale.`,
  );
  for (const material of root.listMaterials()) {
    const normal = material.getNormalTexture();
    assert(
      !normal || !/height|bump/i.test(normal.getName()),
      `A grayscale height image is incorrectly used as a normal map: ${normal?.getName()}`,
    );
    if (/front|back/i.test(material.getName())) {
      assert(
        material.getBaseColorTexture(),
        "Printed pouch material needs its complete baked color texture.",
      );
      assert(
        !/COPY_PENDING|print_master/i.test(
          material.getBaseColorTexture().getName(),
        ),
        "Bake the red film and all artwork layers together before export.",
      );
    }
  }
  return { meshes: root.listMeshes().length, dimensions };
}
