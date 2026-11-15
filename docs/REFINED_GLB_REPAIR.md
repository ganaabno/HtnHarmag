# Refined pouch: diagnosis, repair and verification

This report concerns `assets/sergeenee_surface_refined.glb`, not the earlier `sergeenee_product_FINAL.glb`. The corrected deliverable is `assets/sergeenee_surface_refined_repaired.glb`. The website uses an identical copy under `apps/web/public/models/`.

## Controlled tests and exact causes

1. **Geometry isolation:** evaluated the current refined Blender source into separate export copies, retaining its current shape-key mix and modifiers. Exported those same copies with a single opaque, nonmetallic red Principled material. Both Three.js and Babylon.js render clean geometry without the black/white stripes. Re-exporting the same geometry with the original materials reproduces the stripes. See `docs/qa/refined-repair/isolation_*`.
2. **Materials:** inspected all five product materials and their Base Color, Metallic, Roughness, Alpha, Normal and Coat inputs. The original Blender graphs combine red film and transparent artwork using Mix nodes, remap roughness using Map Range, and combine RGB normal maps with height-driven Bump nodes. The exported GLB does not represent those complete graphs:
   - `FINAL_front_printed_PET` exports only `front_print_master` as Base Color, omitting its red-film composite.
   - `FINAL_back_printed_PET` exports only `back_COPY_PENDING_layer`, omitting the back master and red-film composite.
   - Both use opaque glTF materials. The transparent artwork images' black RGB background is consequently visible, explaining the black body while the separately assigned red weld stays red.
   - Pouch normal slots reference `pouch_wrinkle_height_1024`, a grayscale height image, instead of a tangent-space RGB normal map. The cap normal slot similarly references grayscale `cap_ribs_height_1024`. glTF interprets those RGB values as normal directions, producing the severe streaks and incorrect cap shading.
   - The roughness export bypasses the original Map Range evaluation. Metallic is correctly zero; opaque Alpha and the original clearcoat scalar settings are appropriate and retained.
3. **UVs:** both original panel meshes have one active artwork UV layer. Their 73 × 113 vertex grids map one-to-one to the original artwork, with the back horizontally mirrored for readable rear print. Maximum grid-coordinate error is 2.65e-8. Solidify's front/reverse layers intentionally reuse UVs; the artwork grid itself is not folded or overlapping. No UV repainting, unwrap or layout edits were needed. Reimported UVs match the evaluated source within 8.43e-8.
4. **Export contents:** the broken GLB includes the 200 m studio floor, four hidden `BEFORE_SHAPE_POLISH` backups, helpers and morph targets. These introduce excessive bounds and potential overlapping surfaces, although the product-only material isolation still reproduces the streaks. All original image files are embedded: this is a shader translation and export-scope failure, not missing texture downloads. Original materials default to OPAQUE and double-sided. `export-inspection.json` records every primitive, texture slot, alpha mode, double-sided flag and embedded image, including grayscale pixel checks.

The original-material isolation also passes structural glTF validation. A validator pass alone does not establish that a material renders correctly.

## Repair scope

- Kept the current refined source's exact evaluated world-space vertices, original artwork UVs and material assignments. No shape rebuilding, fairing, smoothing, decimation, rescaling or new artwork.
- Froze the existing shape-key mix, Solidify, Subdivision, cap bevels and thread curve conversion on export copies only. Triangulated those copies and calculated tangents without moving vertices.
- Evaluated the existing material graphs into UV textures: complete color composites, linear roughness and actual tangent-space RGB normals. A texture-space bake plane uses the pouch/cap physical UV metrics; no studio lighting is baked into color. Original scalar Metallic, Alpha, IOR, Roughness and Coat settings are retained.
- Changed only export-copy materials corresponding to `FINAL_front_printed_PET`, `FINAL_back_printed_PET`, `PET laminate • supplied PBR • subtle film`, `Heat weld • flattened embossed laminate`, and `Cap • off-white injection molded polypropylene`. Export materials have a `glTF_` prefix.
- Exported only the 15 current product meshes. Original procedural source, hidden backups and the broken GLB remain preserved.

## Verification results

- Reimported the actual corrected GLB into a separate Blender scene and rendered front/back. All 15 meshes match evaluated source vertex positions in both directions with **zero measured vertex error**. Material boundaries and UVs are preserved.
- Dimensions, glTF X/Y/Z: **0.102293674 × 0.194600007 × 0.043710865 m**. This is the current refined shape, not the slightly different earlier FINAL export.
- Independently loaded the corrected GLB in **Three.js 187 and Babylon.js**, inspected front/back/side/three-quarter screenshots, and observed red film, intact artwork, white cap/spout and preserved seals/folds without the previous stripes.
- Khronos glTF Validator: **0 errors, 0 warnings**. Five materials, 15 meshes, 12 embedded images; no studio floor, backup meshes, morph targets or external texture dependencies.
- Corrected GLB: **18,704,556 bytes**, SHA-256 `870a2f2c6c1977714927e71a521ebbf3225362b3281b9ec1f77a757d0643f9dd`.
- Website publishing copies this inspected GLB byte-for-byte. Geometry quantization and additional texture compression are intentionally omitted so the delivered model is exactly the inspected artifact. The larger download is the performance tradeoff.

## Files and evidence

- Corrected asset: `assets/sergeenee_surface_refined_repaired.glb`.
- Website asset: `apps/web/public/models/sergeenee_surface_refined_repaired.glb`.
- Runtime references: `packages/three/src/model-registry.ts`, `packages/three/src/cinematic-stage.tsx`, `packages/commerce/src/index.ts`. No runtime material overrides or studio-helper filtering are needed for the corrected export.
- Updated preparation/verification/audit scripts use the repaired refined asset, preserve exact bytes and reject the broken refined GLB.
- Full diagnostics and screenshots: `docs/qa/refined-repair/`, including `diagnosis.json`, `export-inspection.json`, `uv-grid.json`, `reimport.json`, `isolation_viewers.json`, `repaired_viewers.json`, `website.json` and the corresponding PNGs.
- Reproducible Blender and browser scripts: `scripts/glb-repair/`. Blender scripts run against the saved source snapshot in `C:/Users/77/dev/blender/refined_glb_repair/`; the viewer harness uses the existing independent Three.js/Babylon.js installation in `C:/Users/77/dev/blender/glb_repair/`.
- Preserved source snapshot and standalone export-ready Blender file: `C:/Users/77/dev/blender/refined_glb_repair/source_snapshot.blend` and `sergeenee_surface_refined_gltf_ready.blend`. The live procedural Blender file was not replaced.

```sh
node scripts/prepare-sergeenee-model.mjs
node scripts/verify-sergeenee-model.mjs assets/sergeenee_surface_refined.glb
node scripts/glb-repair/inspect-export.mjs
node scripts/glb-repair/verify-viewers.mjs isolation
node scripts/glb-repair/verify-viewers.mjs repaired
node scripts/glb-repair/verify-website.mjs
```

The website verifier expects the production preview at `http://127.0.0.1:5174` by default; override with `E2E_BASE_URL`.
