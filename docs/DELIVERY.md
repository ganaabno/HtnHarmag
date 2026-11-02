# Local delivery — Hatan Harmag

Implemented in `C:\Users\77\dev\HatanHarmag` with the supplied logos, project photographs and both original GLBs. Source assets were preserved. The React 19 / Vite / Bun / Turborepo application includes a shared R3F stage, pinned GSAP story chapters, procedural berries and growing vegetation, a two-product 3D carousel, interactive product pages, persistent cart, validated local demo checkout and confirmation, newsletter demo, company story, ingredients, impact transparency and structured journal pages.

## Start

```sh
bun run dev
```

The normal local URL is `http://127.0.0.1:5173`. No credentials or environment variables are required. Production files are in `apps/web/dist`; `bun run --cwd apps/web preview` serves the production build.

## Verified

- Production build and strict TypeScript compilation passed.
- ESLint passed without warnings.
- Six Vitest tests passed.
- Eight Playwright desktop/mobile tests passed: shopping flow, saved cart, quantities, invalid and valid checkout, demo confirmation, inquiry-only product, editorial routes, mobile menu, reduced-motion fallback, a single WebGL context, model loading, orbit/zoom/reset/fullscreen controls and context-loss image recovery.
- The production build was inspected in Chromium. All three scroll chapters reached full text opacity. Mobile hero shopping controls were checked at full opacity after removing a delay-prone fade. No runtime errors, failed asset requests or mobile horizontal overflow were recorded.
- Original combined model size: 25,876,496 bytes. Optimized combined model size: 3,276,852 bytes, with embedded artwork, Meshopt compression and WebP textures.

Evidence:

- `docs/qa/production-audit.json`
- `docs/qa/browser-errors.json`
- `docs/qa/home-desktop.png`
- `docs/qa/home-mobile.png`
- `docs/qa/chapter-origin.png`
- `docs/qa/chapter-transformation.png`
- `docs/qa/chapter-future.png`
- `docs/qa/collection-desktop.png`
- `docs/qa/collection-wolfberry.png`
- `docs/qa/detail-desktop.png`
- `docs/ASSET_AUDIT.json` includes original-file hashes.

Fizzi was inspected in desktop/mobile Chromium; reference captures are in `docs/fizzi-desktop.png` and `docs/fizzi-mobile.png`. Its original bright soda art direction was not copied.

## Boundaries

This is a working frontend with an explicitly labeled local demo commerce adapter. No real payment, fulfillment, inventory reservation or confirmation email is sent. Customer contact/address values are not stored. The newsletter form validates but does not send or save email addresses.

The only supplied price is a 2,900₮ Сэргээнээ unit quote for an order of 1,000 units; it is labeled a demo reference amount. The carton has no invented price and uses email inquiry. No current stock figures or additional variants are invented.

The planting visualization symbolizes a campaign ambition and does not claim to prove trees were planted. There is no fabricated verified tree count. Product artwork retains limitations already present in the source GLBs, including photographic glare and fine-print softness. The environmental scene is a procedural stylization, not a scientific landscape simulation.

Nothing was deployed or connected to an external commerce service. Temporary local QA servers are stopped at handoff. See `README.md` for architecture, scripts, integration boundaries, source conventions and SPA hosting requirements.
