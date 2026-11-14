# Pouch GLB export repair

The corruption was in the exported asset, not a lighting or Three.js-only problem. The same original GLB reproduced black laminate, white stripes and overlapping outlines in independent Babylon.js and standalone Three.js viewers.

## Exact findings

| Check | Original exported GLB | Corrected export |
| --- | --- | --- |
| Scene contents | Current pouch plus four `__BEFORE_SHAPE_POLISH` backup meshes, `Dark_studio_floor`, artwork/reference helpers | Only the 15 current pouch, cap and spout meshes, plus one root |
| Bounds | 200 m × approximately 0.195 m × 200 m, because of the studio floor | 0.102293674 m × 0.194600007 m × 0.043714495 m (glTF X/Y/Z) |
| Overlap | Exported obsolete pouch panels/weld/gusset alongside the current ones; overlapping outlines and z-fighting | Backup geometry excluded, rather than deleting or merging the intentional film layers |
| Front color | Raw transparent `front_print_master` image exported without compositing it over the red film | Existing red film and artwork graph baked into one opaque color texture |
| Back color | Only `back_COPY_PENDING_layer` exported; the back master and red-film layers were missing from the resulting material | Entire existing back color graph baked, including its existing copy-pending artwork |
| Normal maps | Grayscale `pouch_wrinkle_height_1024` and `cap_ribs_height_1024` were referenced as tangent-space normal textures | Actual normal-map + height-bump + weld-emboss graphs baked to RGB tangent-space normal maps |
| Roughness | Blender `Map Range` graph was not represented correctly by the exported image alone | Existing remapped roughness baked into a linear-data texture; original scalar settings and clearcoat retained |
| Shape/modifiers | Shape-key targets and unevaluated meshes exported, while the current Blender model also uses solidify, subdivision and cap bevels | Exact evaluated current world-space vertices frozen into separate export meshes; no morph targets or animation |
| Triangulation | Caps and folded weld contain n-gons; initial export emitted tangent-generation warnings | Export copies triangulated explicitly and tangents calculated successfully |

All source texture images were present and packed. The issue was shader interpretation and export scope, not missing source files. The editable Blender source was preserved; original shaders were evaluated and baked, not randomly replaced with different materials. Bake planes used the pouch/cap's physical UV scale and no studio lighting was baked into the maps.

## Geometry and asset checks

- Audited all 15 evaluated product meshes: no loose vertices, duplicate faces, non-finite coordinates, or zero-area faces.
- Original artwork UV maps and material-slot assignments retained on evaluated export copies. Minor floating-point UV values just above 1 are harmless repeat-addressing precision, not corrupted UVs.
- Product dimensions and visible geometry match the current source. Object transforms were frozen into vertex positions without changing dimensions or multiplying the physical meter scale.
- Studio floor and excluded backup objects caused the bad overall bounds; no product stray vertices were found.
- The final asset is self-contained, with embedded PBR textures and no required external image files.
- Original red packaging, labels, cap/spout color, clearcoat, heat seals and gusset geometry are retained.

## Independent verification and website integration

The uncompressed corrected GLB was inspected in independent Babylon.js and standalone Three.js viewers from front, back, side and three-quarter views **before** replacing the website asset. Khronos glTF Validator reported **0 errors and 0 warnings** for that corrected GLB. Screenshots and machine-readable reports are in `C:/Users/77/dev/blender/glb_repair/`.

The website source is `assets/sergeenee_product_FINAL.glb`; its optimized derivative remains `apps/web/public/models/sergeenee.glb`. No runtime lighting or material overrides were introduced. Normal-map texture compression is lossless; color maps use the existing WebP pipeline. Geometry is compressed with Meshopt, without simplification.

The reusable Blender export copy is `C:/Users/77/dev/blender/glb_repair/sergeenee_current_gltf_ready.blend`. It contains only product objects, static evaluated geometry, and packed export-compatible PBR materials. Use this file for routine GLB exports. If editing the original procedural materials or geometry, bake/freeze them again rather than exporting the whole studio scene.

## Regression prevention

`scripts/validate-sergeenee-asset.mjs` rejects studio/backup meshes, unexpected model bounds, non-static shape targets, missing UVs/normals, grayscale height maps wired as normals, and incomplete artwork textures. It is called by both asset preparation scripts.

Run:

```sh
node scripts/prepare-sergeenee-model.mjs
node scripts/verify-sergeenee-model.mjs
node scripts/audit-assets.mjs
```

The dedicated preparation script updates only the pouch, leaving the wolfberry asset untouched. `verify-sergeenee-model.mjs` optionally accepts the original bad GLB path to verify that the guard rejects it.

## Final verification results

- Optimized website GLB: 5,230,036 bytes, 15 meshes, 5 materials, 8 embedded images. No geometry simplification was used.
- Both Babylon.js and standalone Three.js loaded that optimized file successfully, with zero browser errors, and front/back/side/three-quarter screenshots were inspected.
- Both uncompressed and optimized GLBs report 0 validator errors and 0 warnings. The optimized report includes informational notices about the validator not decoding `EXT_meshopt_compression`; actual Meshopt decoding was independently exercised in both renderers.
- Optimized bounds differ from the uncompressed source by less than 0.009 mm, due to normal Meshopt position quantization.
- Structural verification passes for both files, and the regression guard rejects the original corrupt GLB.
- Website integration test passed: `tests/e2e/webgl.spec.ts`, desktop project. It exercises real model loading, viewer controls, fullscreen, context-loss fallback and the cart afterward.
- `docs/ASSET_AUDIT.json` was regenerated with the corrected source SHA-256 and optimized file metadata. Existing runtime lighting and materials were not overridden.
