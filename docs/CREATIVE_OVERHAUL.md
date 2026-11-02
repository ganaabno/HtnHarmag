# Hatan Harmag — creative direction overhaul

## Audit and direction

The supplied Fizzi and ORYZO sites informed the product-first interaction and editorial pacing. Neither layout was reproduced. The existing local reference captures and `docs/qa/before-overhaul-1440.png` provide the visual baseline.

Inspected the home page (hero, three pinned chapters, values ribbon, collection, origin, impact, journal), shared header/footer, product detail, editorial routes, commerce data, rendering, inspection state, GSAP timelines, tokens and responsive rules.

### What weakened the original presentation

- The original hero mixed an ivory/plum wash, circular scenery, four unconnected berries, vector foreground dunes, and four large headline lines. These competed with the pouch rather than framing it.
- The model itself was not defective. Its scene is centered with `Box3` and normalized to 2.65 world units tall. The original hero multiplied this by 1.12 on desktop and 0.65 on mobile. A 35° camera at roughly 7.2 units and further scroll-driven shrinking weakened product presence, particularly on mobile and in chapters.
- Collection previews defaulted to noninteractive. Their parent interpreted horizontal drags as product switches, preventing the expected examine-in-hand interaction. A second translucent product and circular background occupied valuable composition space.
- The original footer displayed a small product in a wide, short viewport, with decorative berries and terrain. Changing only the headline or adding movement could not fix that framing.
- Several existing body styles were extremely small. The new campaign styles use readable body sizes, controlled serif display sizes, and distinct compositions at desktop, tablet and phone widths.

### Asset inspection

The original GLBs remain unchanged. The already optimized public models retain embedded packaging artwork, normal/roughness maps and clearcoat extensions:

| Model | Public GLB | Meshes | Materials | Embedded images |
| --- | ---: | ---: | ---: | ---: |
| Сэргээнээ | 1,980,924 bytes | 15 | 5 | 5 |
| QN Black Wolfberry | 1,295,928 bytes | 10 | 7 | 21 |

Inspected the actual GLB node transforms and material JSON, including the pouch panels, spout, ribbed cap, red film, polypropylene and printed carton faces. The pouch has PBR clearcoat (0.27); the carton contains its supplied printed panels and clearcoat maps. No new packaging, replacement label, medical assertion, current retail price, or planting count was invented. The underlying inventory remains a demo; Сэргээнээ's 2,900 ₮ price disclosure and the carton's inquiry-only status remain intact.

## Implementation

- Burgundy studio hero with a warm ivory headline, large front-facing original GLB, restrained botanical accent and architectural lighting panel. Removed foreground dunes, sun disc and unrelated floating berries.
- Entrance shortened to 2.6 seconds, with earlier product reveal and restrained type movement. The product settles rather than floating continuously.
- Cinematic scene transforms remain on the outer product group; yaw/pitch remain owned by the inspection state on the inner group. Scrolling never resets user angles.
- Collection now offers direct 360° rotation, vertical limits, inertia, genuine two-contact pinch, wheel/keyboard zoom, reset and fullscreen. Product selection uses the arrow controls, tabs or the focused carousel keyboard interface. Fullscreen stops page scrolling, contains keyboard focus and exits with Escape.
- Hero controls provide zoom/reset and open the product's full inspection route. Existing product-detail controls continue to work.
- Product cameras fit rotated bounding boxes and viewport aspect ratio when zooming, rather than fitting only the original upright height. Hero framing accounts for its off-center placement, too.
- Explicit ACES filmic tone mapping and sRGB output; warm key, cooler fill, rim light and rectangular reflection sources. Embedded material maps stay intact.
- Macro origin chapter uses a connected branching composition with varied berries, leaves and procedural surface grain. This is an artistic botanical visualization, not a scientific specimen reconstruction. The product chapter restores the pouch as focal point; impact uses actual supplied landscape photography and modest vegetation.
- Ivory studio storefront, warm earth origin editorial, forest impact section, asymmetric journal rhythm and royal-purple ending. The footer is rebuilt around a large product and two concise serif statements.
- One shared demand-rendered R3F canvas, cached GLTF loads, offscreen view guards, adaptive DPR and no additional runtime dependencies or backend.
- Reduced-motion mode suppresses entrance/pinned cinematic motion while preserving manual product inspection. Context-loss and unavailable-WebGL image fallbacks remain available.

## Verification and artifacts

Run from the repository root:

```sh
bun run typecheck
bun run lint
bun run test
bun run build
```

Browser regression coverage lives in `apps/web/tests/e2e`. The responsive visual/interaction audit can be rerun from `apps/web` with `node qa-overhaul.mjs` while Vite serves `http://127.0.0.1:5175`.

The audit captures hero, origin, product, impact, collection, carton, footer and wordmark at 1920×1080, 1440×900, 768×1024 and 390×844. Output: `docs/qa/final-*.png` and `docs/qa/creative-overhaul-report.json`. Earlier captures were reviewed and revised for phone CTA clearance, tablet product clipping and footer product scale.

`before-overhaul-1440.png` was captured before implementation. Existing `home-mobile.png` and `upgrade-*.png` are earlier project baselines, not newly reconstructed “before” images.

Performance checks cover one renderer, bounded resources across repeated product visits, angle preservation across scrolling, mouse and true touch inspection, and context-loss fallback. Browser verification is Chromium-based; physical-device and cross-browser performance remain outside this local audit.
