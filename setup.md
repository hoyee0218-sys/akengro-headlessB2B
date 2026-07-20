# BUILD.md — Claude Code build brief: Hydrogen B2B storefront (demo → SparkLayer-ready)

**Audience:** Claude Code.
**Goal of this pass:** scaffold a **fork-ready Hydrogen storefront** that (a) looks and
navigates like a real B2B store using this design system, and (b) is **architected so
SparkLayer + Shopify Customer Account API + the ERP partner sync drop into clearly-defined
seams** with zero refactor. Build the **storefront first**, behind a **mock layer**, then
expose the integration boundary. **Do not** build a production checkout/auth/ERP integration
in this pass.

> Read alongside the design-system root `readme.md` (visual + content foundations) and the
> original **"Headless B2B Storefront — Design System & Generation Brief"** (§0–§10). This file
> is the *build sequence + integration-readiness* layer on top of that brief. Where they
> overlap, the original brief's constraints win.

---

## 0. Non-negotiables (read first)

1. **Demo discipline.** The deliverable is a *convincing, navigable, themed demo* with the
  integration seams visible — not a finished product. The "critical 30%" (real checkout,
   auth→entitlement, ERP/SparkLayer data) is **stubbed behind a mock layer**, every mocked
   value carries a visible `DemoDataBadge` ("DEMO DATA"). Never fake completeness there.
2. **Layer ownership (do not blur).** We own: storefront UI, the custom B2B account
  experience ("Mine sider"), and the auth→entitlement *bridge*. We **consume, never
   reimplement**: SparkLayer (B2B pricing/quotes/cart/orders), Shopify Customer Account API
   (identity/session/credentials), ERP→SparkLayer sync (partner-owned).
3. **Oxygen runtime (workerd).** Web-standard APIs only (Fetch, Web Crypto, Streams) — **no
  Node APIs**. Worker ≤10 MB, cold start ≤400 ms → SSR/loaders over heavy client JS,
   code-split, lean deps. Entry `index.js` (standard Hydrogen scaffold). No proxy in front of
   Oxygen. ≤110 env vars.
4. **Everything merchant-specific is config/tokens.** Re-skinning a fork = edit
  `app/styles/tokens.css` + `merchant.config.ts` only. No per-merchant component edits.
5. **Server-side entitlement boundary is sacred.** A customer must NEVER see another's
  pricing/orders/quotes. All entitlement + price resolution happens in **loaders**
   (server-side). Never trust client-supplied identity for price/order access.

---

## 1. Tech baseline

- **Hydrogen** (current calendar release) on **React Router**, **SSR-first**, data via
**loaders** (parallel, server-side). Minimise client JS.
- **Styling:** ship the design system's token CSS as `app/styles/tokens.css` (it is an
`@import` list — see §3). Components are token-driven CSS; no CSS-in-JS runtime.
- **SparkLayer:** REST/SDK for data where we render our own UI; their **web components only**
where rebuilding isn't worth it (accept their async client load on authed B2B sessions).
- **TypeScript** throughout; the seam interfaces (§5) are the typed contract.

---

## 2. What already exists (this design system) — reuse, don't rebuild

This repo is the **design source of truth**. Port it; do not redesign.

- **Tokens** → `styles.css` (`@import` list) + `tokens/*.css`. Copy wholesale into
`app/styles/`. `tokens/spark-mapping.css` already maps our tokens → SparkLayer `--b2b-`*
CSS vars — keep it as the single Spark theming file.
- **Components** (`components/<group>/<Name>.jsx` + `.d.ts` + `.prompt.md`):
Button, IconButton, Input, Select, Checkbox, Switch, Badge, Tag, Card, Tabs, and the B2B
commerce primitives **PriceDisplay, StockIndicator, QuantityStepper, QtyBreakTable,
ProductCard, OrderStatusBadge, DemoDataBadge**. These are the public API — read each
`.prompt.md`. Re-home them under `app/components/` as the shared core (§7).
- **UI kits** (the visual target to match):
  - `ui_kits/storefront/` — Home, PLP (collection), PDP, **Checkout** (PO no. / cost center /
  multi ship-to / invoice|card — order-create stubbed).
  - `ui_kits/account/` — "Mine sider": Dashboard, **Hurtigbestilling** (quick order pad + CSV
  paste), **Mine lister** (saved lists + recurring), Orders + Order detail, **Tilbud→ordre**
  (quote conversion), Price list, Credit, **Brukere** (users + approval), **Varslinger**
  (notifications + back-in-stock).
  The kits use a preview shim + mock `data.js`; that mock data shape is your fixture spec for
  the demo providers (§5/§6).

> The kits are React-via-Babel previews. In Hydrogen, re-implement these as real routes/
> components, but keep the **same component API, markup structure, class names, and Norwegian
> copy** so the visual result is identical.

---

## 3. Token & config layer (generation step 2)

```
app/styles/tokens.css        # the @import list from this repo's styles.css
app/styles/tokens/*.css      # colors, typography, spacing, radius, shadow, motion, base
app/styles/spark.css         # = tokens/spark-mapping.css (our tokens → --b2b-* vars)
merchant.config.ts           # see merchant.config.example.ts in this repo
```

`merchant.config.ts` (non-visual, per-merchant; PUBLIC values only — no secrets):
`merchantName, locale ('nb-NO'), currency ('NOK'), vatMode ('b2b-ex-vat'|'inc-vat'), sparkLayer:{siteId}, features:{quotes,reorder,creditDisplay}, logo:{src,alt}, favicon`.
Read `vatMode` in `PriceDisplay`; gate account sections on `features.*`.

**Self-host fonts.** The design system loads Archivo / IBM Plex via Google Fonts `@import` for
preview convenience. For Oxygen, **self-host woff2** and replace the `@import` in
`tokens/fonts.css` with local `@font-face`. (Flagged: these are neutral placeholder faces — a
real merchant swaps `--font-`*.)

---

## 4. Navigation, menus & routing (the part you flagged)

**Menus come from Shopify Admin, not hard-coded.** The merchant manages their header/footer
nav in Shopify → Online Store → Navigation; we read it at request time.

- **Source:** Storefront API `menu(handle: "main-menu")` (and `"footer"`), fetched in the
**root loader** so header/footer render SSR on every route. Map each `menuItem` →
`{title, url, items[]}`. Resolve `url` against `resourceId` so a menu item that points at a
Shopify **collection / page / product** routes correctly without us guessing.
- **Header/Footer** components (already designed in `ui_kits/storefront/parts.jsx`) take the
menu as a prop — replace the hard-coded `nav` array there with the loader data. Keep the
visual structure identical.

**Collection / PLP routing — likely custom, plan for it:**

- Default: `routes/collections.$handle.tsx` with a loader that does a **parallel** fetch:
(1) Storefront API `collection(handle){ products }` for catalog/SEO/SSR, and
(2) **PricingProvider** (§5) to overlay entitlement-aware prices + qty breaks per product
for the authed B2B customer. Render `ProductCard` with the resolved price slot (or `gated`).
- **Why custom may be needed:** B2B catalogs are often **entitlement-scoped** (a customer only
sees SKUs/collections their price list grants). Build the loader so the **product list
itself can be filtered/augmented by the EntitlementProvider**, not just the prices. Keep
collection *content/SEO* from Shopify, but treat *visibility + price* as a server-side
entitlement overlay. Make this overlay a single well-named function so swapping mock→real is
one change.
- Search/filter: Storefront API or Search & Discovery; keep the client bundle lean.

**Routing map (initial):**

```
/                       Home
/collections/:handle    PLP (Shopify collection + entitlement/price overlay)
/products/:handle       PDP (price + qty-break slot; add-to-cart → B2B cart)
/search                 Search/filter
/cart  /checkout        Cart review + order-create handoff (STUBBED this pass)
/account/*              "Mine sider" — see §6 (behind Customer Account API)
/account/login          Custom login UI (identity via Shopify, never our own creds)
```

---

## 5. Integration seams — typed interfaces in core + mock impls (generation step 7)

Define these as **TypeScript interfaces in the shared core**, each with a **MockProvider**
(realistic demo data, drives the `DemoDataBadge`) and a **stub RealProvider** (throws
`NotImplemented` with a clear message). Select impl by env: `INTEGRATION_MODE=mock|real`.
**All providers are called from loaders/actions only.**

```ts
// PricingProvider — fed by partner's ERP→SparkLayer sync
getPriceForCustomer(productId, customerCtx): ResolvedPrice
getQuantityBreaks(variantId, customerCtx): PriceBreak[]

// EntitlementProvider — Shopify identity → B2B context  (THE bridge, §6)
resolveEntitlements(shopifyUser): { companyId, priceListIds, permissions }

// OrderProvider — checkout handoff
createOrder(cart, customerCtx): { platformOrderId, sparkCartId }   // Shopify Admin/Orders API
syncOrderToSparkLayer(order): void                                  // b2b tag + import metafield

// AccountDataProvider
getOrderHistory(customerCtx) / getQuotes(customerCtx) / getCredit(customerCtx)
getSavedLists / getUsers / getApprovals / getNotifications / getReorderHistory  // (features 1–8)
```

- **Mock data shape** = the kits' `ui_kits/storefront/data.js` + `ui_kits/account/data-b2b.js`.
Use them as the fixture contract so the demo UI is fully populated.
- **SparkLayer mapping notes** (so the seam is *ready*, not built):
  - `PricingProvider` → SparkLayer price-list API keyed by `priceListIds` from entitlements.
  - Quotes (feature 8) → SparkLayer quotes; `Tilbud→ordre` calls `OrderProvider.createOrder`.
  - B2B cart/add-to-cart → route through SparkLayer cart (web component or SDK). On the PDP/PLP,
  the add-to-cart action must target the **B2B cart**, not the default Storefront cart.
  - `syncOrderToSparkLayer` → apply the `b2b` order tag + import metafield per Spark's pattern.
- **Visibility gating:** a `<B2BGate>` helper (hide retail price / add-to-cart for
non-entitled or logged-out visitors) — the `ProductCard`/`PriceDisplay` already accept a
`gated` prop; wire it from `EntitlementProvider`.

---

## 6. Auth & the entitlement bridge (the differentiator — get exactly right)

- **Identity = Shopify Customer Account API.** Login/session/credentials are Shopify's. We
build only the **custom account UI** ("Mine sider") on top — never custom auth primitives.
- **Bridge = core, tested.** ONE resolution path `shopifyAuthedUser → sparkLayerEntitlements`
(`EntitlementProvider.resolveEntitlements`). Lives in core so every fork inherits it.
- **Hard authz boundary (fleet-critical):** entitlement + price/order/quote resolution is
**server-side only** (loaders). Add tests around this in core — one bug replicates across
every merchant fork. This is the single most important thing to test.
- **Account routes** = the `ui_kits/account/` screens, each behind the Customer Account
session, each loading via `AccountDataProvider`. Gate by `merchant.config.features` and by
`permissions` from entitlements (e.g. approval queue only for approver roles).

---

## 7. Fleet architecture (don't generate plain forks)

```
core (versioned package / base template)   ← updated centrally; security fix = bump + redeploy
  └── components, account layer, seam interfaces + mock providers, entitlement bridge, business logic
merchant repo (thin)
  ├── merchant.config.ts
  ├── app/styles/tokens.css      (Claude Design output — this repo)
  ├── assets/ (logo, imagery)
  ├── content/ (copy, CMS wiring)
  └── pulls core as dependency
```

The entitlement bridge (§6) and seam interfaces (§5) live in **core** so every merchant
inherits a correct, tested access boundary.

---

## 8. Build order (do in this sequence; stop at a themed, navigable demo)

1. **Scaffold Hydrogen skeleton** → confirm Oxygen-ready (`index.js`, web-standard APIs, builds & deploys).
2. **Token layer + `merchant.config.ts` + Spark var mapping** (§3). Self-host fonts.
3. **App shell + Shopify-Admin-driven header/footer nav** (root loader menu fetch, §4). Port Header/Footer.
4. **Catalog:** collection/PLP loader with entitlement+price overlay (§4) → `ProductCard` →
  PDP (price + qty-break slot; add-to-cart → B2B cart). All prices via `PricingProvider`.
5. **Auth entry (Customer Account API) + entitlement bridge (§6) WITH TESTS.**
6. **Account layer / "Mine sider"** (§6): dashboard, quick order, saved lists, orders + detail,
  quotes + `Tilbud→ordre`, price list, credit, users + approvals, notifications.
7. **Seam interfaces (§5) as typed core interfaces + MockProviders** (demo mode). Stub
  RealProviders that throw `NotImplemented`.
8. **Cart review + order-create handoff seam** — STUBBED (`createOrder` mock returns a fake
  order id; success screen already designed). Mark with `DemoDataBadge`.
9. **Demo data + "DEMO DATA" markers everywhere mocked; polish the key screens** to match the
  kits pixel-for-pixel.

**Stop here.** Do not attempt production checkout / real auth→entitlement / ERP hardening.

---

## 9. Definition of done (this pass)

- [ ] Deploys to Oxygen; worker ≤10 MB; web-standard APIs only; `index.js` entry.
- [ ] Re-skinnable by editing only `tokens.css` + `merchant.config.ts`.
- [ ] Header/footer nav driven by **Shopify Admin menus** (root loader); collection routes
  ```
  resolve from Shopify with a **server-side entitlement/price overlay**.
  ```
- [ ] Every price/order/quote read goes through a **seam provider in a loader** — never client
  ```
  identity. Entitlement bridge has tests.
  ```
- [ ] `INTEGRATION_MODE=mock` yields a fully-populated, navigable demo matching the UI kits;
  ```
  every mocked surface shows `DemoDataBadge`.
  ```
- [ ] `INTEGRATION_MODE=real` compiles; RealProviders throw `NotImplemented` with messages
  ```
  naming the owner (SparkLayer / Shopify Admin / ERP partner) — i.e. the seams are _visible_.
  ```
- [ ] Add-to-cart targets the **B2B cart** seam; PDP qty-breaks come from `getQuantityBreaks`.

---

## 10. Open questions to confirm before/early in the build

- Hydrogen calendar release version to pin? Merchant Shopify **plan tier** (Basic+; not
Starter/dev) verified for Oxygen?
- SparkLayer: SDK vs REST for our-rendered surfaces, and **which** flows use their web
components (B2B cart? quotes?)? `siteId` for the demo?
- Customer Account API: new (GraphQL) Customer Accounts confirmed as the identity provider?
- Menu handles in Shopify Admin (`main-menu`, `footer`, others)? Any **entitlement-scoped
collections** (catalog visibility per price list), or is visibility price-only for the demo?
- Recurring orders (feature 7): keep folded into Saved Lists, or model as a separate
subscription entity in `AccountDataProvider`?

