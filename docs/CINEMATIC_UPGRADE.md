# Cinematic hero, inspection and closing chapter

The existing monorepo, routes, catalog, cart and demo checkout are preserved. No backend or payment changes were introduced. The supplied GLBs, packaging materials, logos and source photographs are unchanged. Source snapshots from before this upgrade are in `.cache/cinematic-upgrade-before`.

## The birth of Harmag

`apps/web/src/routes/index.tsx` choreographs an approximately 3.2-second GSAP reveal: atmosphere/brand and a warm light sweep, berries arriving from several depths, a deliberate camera dolly, then the actual pouch and staggered Cyrillic characters. Important shopping controls remain visible during loading. Scrolling skips an unfinished intro and takes over a reversible ScrollTrigger timeline.

GSAP owns timeline parameters and editorial text. R3F owns the actual scene transforms. A staging parent handles the cinematic pose while a centered child retains the user's inspection angle. Pointer interaction freezes automatic staging; releasing the pointer does not restore a default angle. Idle hero motion is limited to restrained pointer parallax.

Depth is created with perspective, layered botanicals, atmospheric gradients and soft light; no full-screen depth-of-field/bloom composer was added. This keeps the shared multi-view canvas light and avoids blurring packaging text. Procedural berries now have subtly irregular geometry, small surface roughness/bump detail and curved leaves. These supporting elements remain artistic interpretations, not botanical scans.

## Product inspection

`packages/three/src/interaction.ts` is a pure, typed controller with explicit `INTRO`, `IDLE`, `USER_INTERACTING`, `SCROLL_ANIMATING` and `RESETTING` states. Native DOM pointer capture isolates gestures to the dedicated viewing region.

- Left-drag / one-finger drag: unrestricted horizontal rotation and bounded vertical tilt around the model's bounding-box center.
- Release: damped inertia, then retention of the chosen angle.
- Two-finger pinch: bounded, smoothed zoom.
- Wheel: zoom inside the detail viewer; the hero arms wheel zoom after focus/grab. Scrolling outside the hero region remains page scrolling.
- Double-click, Home, R or reset button: smooth shortest-arc reset, including after multiple full revolutions.
- Arrow keys: rotation. Plus/minus keys or buttons: zoom.
- Detail fullscreen retains its keyboard focus handling and Escape exit.

Zoom buttons no longer reset camera orientation. Each Drei View has its own perspective camera, avoiding camera conflicts between the hero, detail viewer and footer. Models are centered and normalized without editing the source meshes or printed artwork. Distance limits are derived from normalized bounds.

`stepInspection` is frame-rate independent, dissipates inertia, and treats the first frame after idle separately so a long idle interval cannot cause an instant reset. GSAP lag smoothing is disabled according to the installed Lenis integration guidance; scroll playback now follows elapsed time even on slow frames. Lenis and WebGL respond to runtime reduced-motion changes.

## The land that gives back

`apps/web/src/features/footer/CinematicFooter.tsx` provides the final chapter: a full-width purple landscape, warm horizon, giant two-stage Mongolian statement, actual product composition, restrained camera/light parallax, and a small growing native-looking plant. Functional navigation, real contact details and the existing newsletter demo sit below the scene. The final oversized `HATAN HARMAG` signature closes the page.

The footer reuses the existing R3F canvas through a third View; it does not create another WebGL canvas. Its artwork is kept clear of links and controls. No social profiles were supplied, so no social links were fabricated. Privacy and demo terms link to actual anchored sections of the existing policy page. Plant growth represents the campaign's ambition, not a verified planting record.

Closing-section hierarchy and scale were informed by https://oryzo.ai/; its branding and wording were not copied. The requested Mongolian statement, product identity, landscape and signature are specific to Hatan Harmag.

## Rendering and ownership

- `packages/three/src/cinematic-stage.tsx`: shared canvas, isolated cameras, scene composition and model normalization.
- `packages/three/src/botanicals.tsx`: shared small procedural geometry/textures per view, disposed on teardown.
- `packages/three/src/index.tsx`: stable public exports.
- `apps/web/src/styles/cinematic.css`: scoped overrides for the three upgraded areas.

Rendering is on demand. Scene observers stop offscreen per-frame work; input, scroll, intro progression and damping request frames when needed. There are no per-frame React state updates. Cached GLB geometry/materials are shared deliberately; cloned preview materials and generated botanical assets are disposed. Adaptive DPR regresses during manipulation. Context loss and reduced motion preserve image fallbacks and normal shopping.

## Validation

- ESLint, strict TypeScript checks and production build passed.
- 10 Vitest tests passed, including bounds, ownership, inertia, held angles and shortest-path reset.
- 16 Playwright tests passed across desktop and mobile: mouse, actual two-contact CDP touch/pinch, wheel, keyboard, reset, fullscreen, repeat scrolling, model switching, context loss, runtime reduced motion, cart and checkout regression.
- Repeated SPA product navigation checks bounded Three.js renderer geometry/texture counts after warm-up. This is a resource-count regression test, not a hardware VRAM profiler or a universal frame-rate guarantee.
- Production screenshots/report: `docs/qa/upgrade-*.png` and `docs/qa/cinematic-upgrade-report.json`.

Run `bun run dev` as before. For an already-running alternate dev port, set `E2E_BASE_URL` when running Playwright; the default remains `http://127.0.0.1:5173`. Tests and implementation remain frontend-only.
