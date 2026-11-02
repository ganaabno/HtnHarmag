# Sergeenee immersive storefront

## Audit and references

Inspected https://fizzi-demo.vercel.app/ with Chromium at desktop and mobile sizes, its complete rendered section structure, and the downloaded `../course-fizzi-next-main/src/slices/` implementation. Reference captures are `docs/fizzi-reference-full.png` and `docs/fizzi-reference-mobile.png`. The reference uses an extended hero/introduction, pinned skydive, themed carousel, alternating text, and an oversized closing statement. Used those patterns without its CMS, Next.js application, brand copy, or can assets. Also reviewed the supplied Prismic course resources and Oryzo closing reference.

The existing app already provides Bun/Turbo, TanStack Router, Motion, GSAP/ScrollTrigger, R3F/Drei, product data, model optimization, inspection, cart persistence, demo checkout, source PDFs, and documentary photography. These are retained. No dependencies were added.

## Actual models

| Product | Supplied source | Runtime GLB | Size |
| --- | --- | --- | --- |
| Сэргээнээ, 150 ml pouch | `assets/sergeenee_product_FINAL.glb` | `apps/web/public/models/sergeenee.glb` | 1,980,924 bytes |
| Чонон Хармаг, QN carton | `assets/qn_black_wolfberry.glb` | `apps/web/public/models/wolfberry.glb` | 1,295,928 bytes |

Registry: `packages/three/src/model-registry.ts`. Models contain embedded artwork: 5 images / 5 materials / 15 meshes for the pouch, 21 images / 7 materials / 10 meshes for the box. They use Meshopt compression, quantization, WebP textures and clearcoat. No external texture paths are missing. Original model geometry, materials, printed artwork, cap and closure components remain intact. The pouch is approximately 0.20m tall and the carton 0.104m tall before normalization. Existing `Model` clones the scene graph, measures its world bounding box, centers its pivot and normalizes height to 2.65 scene units through a parent group. It shares original geometries and materials and prevents accidental disposal of cached assets. Camera-facing front pose was checked in screenshots.

There are no supplied botanical or berry GLBs, loose HDRs, or additional product variants in this repository. Use the existing documentary berry photograph and clearly abstract vector motifs; no procedural fruit is presented as Nitraria. The reference's can model and HDR files remain outside the project and are not used.

## Architecture and animation ownership

- Root layout retains its single shared, transparent, adaptive-DPR WebGL canvas.
- `JourneyView` adds one persistent Drei View and one product instance for the entire homepage. Route changes unmount the view without replacing the root canvas. The old closing product scene is omitted on the homepage.
- `JourneyState` is a mutable ref. One GSAP playhead owns scroll distance; `useProductTimeline` measures section and pin positions and samples a single motion track through position, rotation, depth and scale. Quintic interpolation settles with zero velocity and acceleration at the readable poses. Small flight arcs vanish at their endpoints. The pinned dive rolls forward consistently. `matchMedia` and GSAP context revert triggers and timelines on resize/unmount.
- A separate nested group owns user inspection, using the existing damped, inertial pointer/touch/keyboard controller. Reset restores the printed front. Page scrolling remains available in the gutters; the model's inspection surface captures intentional drags. Wheel zoom only captures after inspection is armed. Motion handles product text changes, independently of the GSAP transform properties.
- Carousel exit carries the old product offscreen at nearly full size, switches the real GLB, waits for its readiness callback, and brings the next product in from the opposite side. The second model preloads when approaching the showcase. Text, theme colors and ring rotation accompany the handoff.
- `useProgress` supplies branded loading progress. Essential geometry readiness starts the entry animation. Product images are genuine supplied fallbacks for unsupported WebGL/model failures; error paths retain readable content and controls.
- Studio environment lighting comes from Lightformers without remote HDR requests. Preserve original PBR materials and color management. No bloom or repeated shadow passes. Idle updates are throttled; hidden/off-page animation stops; reduced motion removes pinning, idle float and dramatic rotations while retaining manual inspection.

## Changed files

Homepage `apps/web/src/routes/index.tsx`; new scoped `styles/sergeenee.css`; stylesheet import in `main.tsx`; persistent scene and loader in `packages/three/src/immersive.tsx`; model registry; shared Model/Lights exports and three package exports; homepage-specific footer scene omission. `packages/animations/src/index.ts` adds a shared section-scroll helper to prevent competition between Lenis anchors and router hash restoration. JournalCard was moved into `features/JournalCard.tsx` because the journal route previously imported it from the replaced homepage. Updated homepage browser assertions and added `tests/sergeenee-audit.mjs`.

## Run and verify

From repository root:

```sh
bun install
bun run dev
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

Vite defaults to 5173; it chooses the next port if occupied. During this session the app runs at http://127.0.0.1:5174/. For this server use `E2E_BASE_URL=http://127.0.0.1:5174` when running Playwright. The capture script currently targets that same port: `bun run --cwd apps/web tests/sergeenee-audit.mjs`.

## Verification results

Animation polish adds `src/features/products/useProductTimeline.ts`, `src/lib/journey-motion.ts`, and a reactive `useMotionPreference` hook. Idle float is isolated in its own group and eases away during scrolling, switching and inspection. Leaving inspection smoothly resets the printed front for the following story. Entrance timing, text reveals, scroll parallax, loader wipe and button feedback were also refined. The motion unit tests cover reverse seeks, endpoint continuity, positive scale and rotation direction; the new desktop/mobile browser checks cover reverse scrolling, resize, both model handoffs and changing reduced-motion preference while the page is open.

- `bun run typecheck`: passed.
- `bun run lint`: passed without warnings.
- `bun run build`: passed, with the Three.js vendor bundle split from the application.
- `bun run test`: all 14 unit tests passed, including four motion-continuity checks added during animation polish.
- `E2E_BASE_URL=http://127.0.0.1:5174 bun run test:e2e`: all 16 desktop/mobile browser tests passed in 4.5 minutes. Coverage includes pointer/touch/pinch/keyboard inspection, resets, the continuous homepage, carousel changes, section navigation, route cleanup, bounded renderer resources, context-loss fallbacks, persistent cart, validated demo checkout, editorial navigation, and mobile menu.
- `tests/sergeenee-audit.mjs`: desktop 1440×960, tablet 820×1180, and mobile 390×844 captures; zero page errors, no horizontal overflow, one canvas, both actual GLBs returning HTTP 200, and working reduced-motion inspection. Machine-readable results are in `docs/qa/sergeenee-audit.json`.
- Normal-motion screenshots of the introduction, dive and finale are also in `docs/qa/`. The latest viewport captures use the `sergeenee-desktop-*`, `sergeenee-tablet-*` and `sergeenee-mobile-*` filenames.
- Following animation polish, type-check, lint and production build passed again. Four targeted browser runs passed: the existing continuous-journey test and the new motion-polish test, each on desktop and mobile. These verify readable poses, one-way dive rotation, reverse seeks, both directional product swaps, resize, route cleanup and live reduced-motion preference changes. Polished intro/carousel captures are attached to the corresponding Playwright results in `apps/web/test-results/`.

## Limits

Only two actual products were supplied; no fictional flavors were added. The 2,900₮ value remains explicitly a trial unit price from the existing quote, not a verified current retail price. The carton has no supplied price. Cart, checkout and newsletter retain their existing explicit demo behavior; no payments, inventory, fulfillment or email backend was introduced. Packaging texture glare and artwork remain as supplied. Software-rendered Chromium verifies rendering and interactions but is not representative of physical-device GPU performance.
