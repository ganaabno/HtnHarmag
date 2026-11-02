# Хатан Хармаг / Hatan Harmag

Mongolian-first immersive storefront built from the supplied brand assets, two product GLBs and company PDFs. This is a local frontend implementation, not a live payment or fulfillment system.

## Run

Requires Bun 1.4+ and Node 22+.

```sh
bun install --frozen-lockfile
bun run dev
```

Open the Vite URL, normally **http://127.0.0.1:5173**.

```sh
bun run typecheck
bun run lint
bun run test
bun run test:e2e
bun run build
```

For first-time browser testing: `bunx playwright install chromium` from `apps/web`. Production output is `apps/web/dist`. Serve it with `bun run --cwd apps/web preview`. An SPA host must rewrite unknown paths to `index.html`.

## Architecture

- `apps/web`: React 19, Vite, strict TypeScript, TanStack file-based Router, Query and Form, Tailwind v4, Radix dialogs/accordions, Motion, Lucide.
- `packages/three`: a single shared R3F Canvas with Drei View portals. Hero and pinned chapters share one scroll-driven scene. Collection and detail views reuse the same GLBs and rendering context. Three.js owns actual product transforms, pointer smoothing and the procedural berry/vegetation scenes.
- `packages/animations`: GSAP / ScrollTrigger and Lenis lifecycle. GSAP owns scroll progression and chapter reveals; Motion owns commerce/menu transitions. They do not animate the same transforms.
- `packages/ui`: reusable shadcn-style Slot-based Button and class merging. Radix primitives provide focus trapping and keyboard interaction in drawers, menus and accordions.
- `packages/commerce`: typed catalog, validated demo adapter, Zustand persistent cart, authoritative catalog totals and quantity limits, Zod checkout schema.
- `scripts/prepare-assets.mjs`: originals → deduplicated, pruned, Meshopt-compressed GLBs with WebP textures (max 2048px). Original files are never overwritten. Run `bun scripts/prepare-assets.mjs` when original GLBs or logos change.
- `docs`: extracted source text and browser QA captures. Source documents remain in `assets` and the public documents folder.

TypeScript 6 is pinned because the installed typescript-eslint release does not support TypeScript 7. `bun.lock` pins all resolved dependencies.

## Content and commerce boundaries

The supplied assets confirm two models: **Сэргээнээ** (150 ml pouch, model identifier and artwork) and **QN Black Wolfberry / Чонон Хармаг** (10-bag carton). Only their actual packaging is used. Three logo PNGs are preserved; the flat color logo is used in the navigation and footer.

The Сэргээнээ brochure includes a **2,900₮ unit quote for 1,000 units**. The storefront labels this a **demo reference price**, not current retail pricing. No price or availability was supplied for the carton, so its CTA is a genuine email inquiry, not a fictitious purchase. Each confirmed product has a single confirmed package option; additional flavors, variants and stock counts are not invented.

No verified current nutrition table was supplied for the carton. Сэргээнээ nutrition numbers are copied from the supplied brochure; units that the table does not explicitly state are not inferred. Medical and treatment claims from promotional documents are not repeated as editorial recommendations.

“Нэг Сэргээнээ — Нэг мод” is presented as campaign wording and ambition. Animations do not produce planting records. Historical project statements are attributed to the supplied report; there is no fabricated live tree counter or independent verification claim.

### Demo checkout

No backend, inventory, payment credentials or email service were supplied. `commerce.createOrder()` validates input and recomputes totals from the catalog. It creates an explicitly `DEMO-` order stored only in the current browser session. It does **not** transmit data, take payment, send confirmation emails, reserve stock or arrange delivery. Customer name/contact/address and newsletter addresses are not saved. Cart item IDs/quantities use localStorage. The confirmation stores no customer PII.

No environment variables are required. `.env.example` documents this. To integrate a real provider, replace the demo adapter behind the typed service boundary, put validation, prices, inventory and payment creation on a server, and add only public frontend configuration to Vite. Never put payment secrets in `VITE_*` values. The UI must stay in demo mode until those integrations and current catalog facts are confirmed.

## Rendering and resilience

One WebGL context, capped DPR (1.2 on narrow screens), local environment lights, Meshopt decoder via Drei, WebP textures, route/code splitting and model caching. The hero model is requested first; the carousel models are loaded as its view approaches the viewport. Detail viewers render on demand rather than continuously; inspection interactions temporarily reduce DPR. Reduced-motion users and devices with 2 or fewer logical cores receive static product images. A lost context switches to image fallbacks while the shopping UI remains operational. Refresh to retry WebGL.

Original packaging artwork may retain photographic glare and fine-print softness from the supplied models. Models and logos are not relettered. `wolfberry.png` is a transparent browser render of the supplied GLB; the pouch fallback comes from the supplied brochure. Project photographs were extracted from the supplied report, not substituted with generic stock imagery.

KTX2 is not required by these assets; WebP plus Meshopt provides the tested portable pipeline. Add KTX2 only with a configured decoder path and target-device checks. No hosted service, CMS or performance monitoring account is connected. Journal records are structured in `src/lib/editorial.ts` for a future CMS adapter. No invented recipes or reviews are published.

## Reference and validation

Studied https://fizzi-demo.vercel.app/ in desktop and mobile Chromium. Its coordinated scroll choreography and product carousel informed the interaction architecture, while the brand art direction, Mongolian editorial copy, environmental transparency and commerce UI are original.

Vitest covers price-less products, invalid/merged quantities, validation, server-boundary total recomputation and non-storage of PII. Playwright covers desktop/mobile catalog navigation, keyboard carousel, cart persistence, invalid/valid checkout, demo confirmation, mobile menu, reduced-motion images, WebGL viewer controls and context-loss recovery. Screenshots and the captured browser error log live in `docs/qa`.

The app is an SPA. Product JSON-LD intentionally omits Offer/availability because no current retail offer is verified. For indexing beyond the client-rendered experience, evaluate prerendering or TanStack Start once real commerce content is ready.


## Cinematic interaction upgrade

The hero reveal, native pointer/touch product inspection and ORYZO-inspired cinematic closing chapter are implemented in the existing shared canvas. See [upgrade notes](docs/CINEMATIC_UPGRADE.md) for animation ownership, controls, performance decisions and validation. The current suite contains 10 unit tests and 16 desktop/mobile browser tests.


