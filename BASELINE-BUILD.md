# BASELINE-BUILD.md — Headless B2B Template: Demo → Production Baseline

**Audience:** scandicommerce dev team.
**Repo:** `HeadlessB2B` (design system root + `storefront/` Hydrogen app).
**Read first:** `readme.md` (design system), `setup.md` (original build brief — its constraints still apply), this file (the conversion plan).

---

## 0. What this project is

We are turning the existing demo-grade Hydrogen storefront into a **reusable production baseline template** for headless B2B merchants on Shopify + SparkLayer. The template is the product. Individual merchants are *implementations* of it: a merchant launch should require **only** (a) editing `app/styles/tokens.css` + `merchant.config.ts`, (b) uploading brand assets, and (c) content work inside Shopify admin (collections, menus, pages). No per-merchant component edits, ever.

**Layer ownership (unchanged from setup.md — do not blur):**

| Layer | Owner | Our job |
|---|---|---|
| Storefront UI, "Mine sider", auth→entitlement bridge | **Us** | Build & maintain |
| B2B pricing, quotes, cart rules, ordering | SparkLayer | Consume via SDK/APIs/web components |
| Identity, session, credentials | Shopify Customer Account API | Consume — never build auth primitives |
| ERP ↔ SparkLayer sync (pricing, customers, stock, order writeback) | Integration partner | **Out of scope.** We consume what lands in SparkLayer. |
| Checkout/order creation | SparkLayer (invoice-first) | Consume its order flow; we do not build a payment checkout |

**Non-negotiables carried over:** Oxygen/workerd runtime (web-standard APIs only, no Node APIs, lean worker), SSR-first with loaders, server-side entitlement boundary (a customer must NEVER see another company's prices/orders/quotes — all resolution in loaders/actions, never trust client identity), nb-NO default locale, NOK, `eks. mva` price display per `vatMode`.

---

## 1. Current state of the repo (audit)

Already working, keep and extend:

- Full route map: home, `collections.*`, `products.$handle`, `search`, `cart`, `checkout` (demo), blogs, policies, pages, sitemap/robots, and 14 account routes under `/account/*` (dashboard, orders + detail, quotes + detail, quickorder, lists, pricelist, credit, users, notifications, profile, addresses, login/logout/authorize).
- Typed **integration seams** in `app/lib/seams/` (`PricingProvider`, `EntitlementProvider`, `CatalogProvider`, `OrderProvider`, `AccountDataProvider`), selected by `INTEGRATION_MODE=mock|real`. All real providers currently throw `NotImplemented` naming the owner.
- **Entitlement bridge** in `app/lib/entitlement.ts` with tests (`entitlement.test.ts`) modelling two companies so the isolation boundary is testable.
- Design system: token CSS (`app/styles/tokens/*`), DS components under `app/components/ds/`, `spark.css` mapping our tokens → SparkLayer `--b2b-*` vars.
- Standard Hydrogen search scaffolding (`lib/search.ts`, `SearchForm*`, `SearchResults*`) wired to the Storefront API `search`/`predictiveSearch` queries.
- Customer Account API GraphQL queries generated (`app/graphql/customer-account/*`).
- Currently pointed at `mock.shop`; demo auth is a session stub; the demo checkout creates fake orders.

**Known architectural correction (Phase 1's core task):** PLP/PDP currently read *catalog content* from the mock `CatalogProvider`. In production, catalog content (products, collections, menus, images, SEO fields) comes from the **Shopify Storefront API**. The seams' job narrows to what Shopify can't answer: per-customer **pricing/entitlement overlay** and B2B account data. Do not port the mock catalog to production.

---

## 2. Target architecture (one paragraph per concern)

**Catalog & content** — Shopify Storefront API. Collections, menus, navigation, pages, blogs are authored in Shopify admin; the storefront renders whatever admin defines. Menus come from the `menu` query (header/footer handles in `merchant.config.ts`). PLP = `collection(handle).products(filters: ...)`; PDP = `product(handle)`.

**Search** — Shopify native search via the already-scaffolded `search` + `predictiveSearch` queries, configured through the **Shopify Search & Discovery app** in admin (filters, synonyms, boosts, related products). S&D filter config surfaces automatically in the Storefront API `productFilters`/`filters` — build the PLP/search facet UI from the API's returned filter definitions, not hardcoded facets. No third-party search vendor in the baseline.

**Identity** — Shopify Customer Account API (the Hydrogen skeleton flow already stubbed in `account_.login/logout/authorize`). Shopify owns credentials and session; we never see passwords.

**B2B engine** — SparkLayer. Three consumption modes, use each where stated:
1. **Web components** for the cart/order surfaces (cart drawer, order summary, checkout handoff) — don't rebuild these.
2. **JS SDK + GraphQL API** wherever we render our own UI: price display in DS components, qty breaks, and all "Mine sider" data (orders, quotes, saved lists, credit, price list).
3. **Auth handshake**: SparkLayer authenticates via a customer metafield (see §4).

**Entitlement bridge** — our code, the template's most-tested path: Shopify authed user → B2B verification (tag + metafield) → SparkLayer context. Server-side only.

**Orders/checkout** — SparkLayer's ordering flow (invoice-first; card via Shopify-hosted payment links on draft orders where enabled). The demo `checkout.tsx` route gets replaced by the Spark cart → order handoff. We do not implement payment processing.

**ERP** — invisible to us. The partner syncs ERP price lists/customers/stock into SparkLayer and writes orders back. If SparkLayer has the data, we render it; if it doesn't, that's a partner ticket, not a storefront ticket.

---

## 3. Phase 1 — Production storefront on a real store (mock catalog → Storefront API)

Goal: the template runs against a real Shopify dev store, fully navigable and content-managed from admin, with pricing still mocked (gated/demo-badged). Ship this phase before touching SparkLayer.

### 3.1 Store connection
- Create the template dev store (or use the shared one). `npx shopify hydrogen link`, pull env. Kill all `mock.shop` references and the `MockShopNotice` path (keep the component; it should only render when the domain is mock.shop).
- Verify Oxygen deploy pipeline from day one (CI: typecheck, lint, vitest, build).

### 3.2 Catalog routes → Storefront API
- **PLP (`collections.$handle`, `collections._index`)**: replace `seams.catalog` reads with `collection(handle)` queries; pagination via `PaginatedResourceSection` (already in repo). Facets: render from the API's S&D-configured `filters` on the collection products connection; filter state in URL search params (SSR-friendly, shareable, crawlable per our SEO rules).
- **PDP (`products.$handle`)**: `product(handle)` query for content (title, description, media, SKU, options/variants via existing `lib/variants.ts`). **Price stays a seam overlay**: content from Shopify, `ResolvedPrice` from `PricingProvider` (mock for now → `DemoDataBadge`), gated when logged out. Keep the existing component API (PriceDisplay, StockIndicator, QtyBreakTable) untouched.
- **Home (`_index`)**: driven by admin — featured collections by handle from `merchant.config.ts`, metaobjects for hero/content blocks if needed. No hardcoded merchandising.
- **Menus**: header/footer from Shopify navigation menus (skeleton `HeaderQuery`/`FooterQuery` pattern in `lib/fragments.ts`); menu handles configurable in `merchant.config.ts`.

### 3.3 Search
- Keep the existing `search` route + predictive search components; confirm they run against the real store.
- Install & configure Search & Discovery on the template store; verify filters defined in S&D appear in the API response and the facet UI renders them generically (type-driven: list, price range, boolean).
- Search results use `ProductCard` with the same price-overlay pattern as PLP.

### 3.4 Content & SEO
- Pages/blogs/policies routes against real store content.
- JSON-LD: Product, BreadcrumbList, Organization. Canonicals on filtered PLP states (filtered = canonical to parent unless whitelisted). Sitemap routes already exist — verify against real store.
- i18n pass: all UI strings through the copy layer with nb-NO defaults per `readme.md` content rules; no hardcoded strings inside components.

### 3.5 Definition of done (Phase 1)
- Fresh clone + env → deployable storefront where **all** product/collection/menu/page content is controlled from Shopify admin with zero code changes.
- Logged-out visitor: full catalog browse, search with S&D facets, gated prices ("Logg inn for pris").
- Demo login (mock seam) still works: prices/account show mock data with `DemoDataBadge`.
- Lighthouse (mobile, PLP + PDP): performance ≥ 90 on the unthemed template. Budget: minimal client JS — loaders do the work.
- `INTEGRATION_MODE=mock` remains fully functional — it is the permanent demo/sales mode of the template, not scaffolding to delete.

---

## 4. Phase 2 — SparkLayer integration (real providers)

Goal: `INTEGRATION_MODE=real` works end-to-end on the template store with a SparkLayer sandbox account.

### 4.1 Auth & the entitlement bridge (do this first — everything hangs off it)
- Implement real Customer Account API login (`account_.login/authorize/logout`) using Hydrogen's customer account client. Session server-side.
- **B2B verification** (SparkLayer's documented headless contract): the logged-in customer must (a) carry the `b2b` customer tag, and (b) have the `sparklayer-authentication` customer metafield populated — with **storefront access enabled on the metafield definition** (set this up on the store; document it in the merchant checklist §6).
- `realEntitlementProvider`: resolve the authed customer → company context → SparkLayer entitlements. Query the tag + metafield server-side via the Customer Account/Storefront APIs; never from client-supplied data.
- Enrich `CustomerContext` (company name, orgnr, terms, credit, price-list label) from SparkLayer via SDK/GraphQL, replacing the `NotImplemented` throw in `getCustomerContext`.
- **Extend `entitlement.test.ts`** to cover the real path with fixtures: non-B2B customer → no context; B2B customer of company A must never resolve company B's lists. These tests are release-blocking for every template version — a bug here replicates to every merchant fork.

### 4.2 Spark runtime loading
- Add a `<SparkLayer>` component in the root/layout following SparkLayer's headless doc pattern: render the `https://sparkcdn.io/sparkjs/{siteId}/live` script **only** when the session is a verified B2B customer, then manually initialize the SDK with the customer email + the authentication metafield value. `siteId` from `merchant.config.ts`.
- Logged-out and non-B2B sessions must load **zero** SparkLayer bytes — this is the performance contract of the whole architecture. Add a test/assertion for it.
- Wire `onLogout` to our Customer Account logout.

### 4.3 Pricing (own UI, Spark data)
- `realPricingProvider`: per-customer resolved prices + quantity breaks from SparkLayer (SDK/GraphQL from loaders where possible; client SDK hydration only where a loader can't reach it — document which and why).
- DS components stay the rendering layer: `PriceDisplay`, `QtyBreakTable`, gating logic unchanged. `demo: false` → no badge.
- Respect `vatMode` everywhere (`eks. mva` labeling).

### 4.4 Cart & ordering (Spark web components)
- Replace the session-based demo cart (`lib/cart.ts`) with SparkLayer's cart: PDP add-to-order via the Spark widget or SDK `cart` update; cart drawer/page via Spark web components inside our `Aside`/`CartMain` shells.
- Theme the components exclusively through `app/styles/spark.css` (our tokens → `--b2b-*` vars). If a needed var is missing, extend the mapping file — never inline-style Spark components.
- Retire the demo `checkout.tsx` order-create action; ordering completes through SparkLayer's flow (invoice-first; PO number / reference fields per Spark config). `realOrderProvider` covers anything we must trigger ourselves; otherwise it thins out — Spark owns order creation.

### 4.5 Mine sider (own UI, Spark + Shopify data)
- `realAccountDataProvider` feeding the existing account routes:
  - **Orders + detail**: Customer Account API orders merged/aligned with SparkLayer order data (source per field documented in the provider).
  - **Quotes + convert-to-order**, **saved lists/reorder**, **price list view**, **credit**: SparkLayer SDK/GraphQL.
  - **Profile/addresses**: Customer Account API (mutations already generated).
- Feature flags in `merchant.config.ts.features` must actually gate routes/nav (quotes, reorder, creditDisplay, users, notifications): flag off → route 404s and nav item disappears. This is how we "take modules out based on merchant need" — config, not deletion.
- Where SparkLayer has no backing feature for a route (evaluate per route against the Spark sandbox), the route ships flag-off by default and stays mock-only for demos. Do not fake production behavior.

### 4.6 Definition of done (Phase 2)
- On the template store + Spark sandbox with `INTEGRATION_MODE=real`: B2B login → correct per-company prices on PLP/PDP → Spark cart → order placed → order visible in Mine sider. Two test companies verified isolated (automated).
- Non-B2B/logged-out sessions: zero Spark network requests.
- Every feature flag verified in both states.
- `INTEGRATION_MODE=mock` still fully green (regression suite).

---

## 5. Working rules

- **Template discipline is the product.** Before writing merchant-specific anything, ask: "is this a token, a config field, or admin content?" If it can't be one of those three, it probably belongs in core — raise it.
- **Seams are the only integration doorway.** No route/component may import SparkLayer or call Shopify Admin-side data directly; everything goes through the provider interfaces in `app/lib/seams/types.ts`. Extend the types when a contract is missing — that's a deliberate, reviewed change.
- **Loaders over client JS.** Any client-side data fetching needs a stated reason in the PR.
- **Keep both modes alive.** `mock` is our permanent sales-demo mode; every PR passes the suite in both modes.
- **PR granularity:** one route-group or one provider per PR. Each PR states which §3/§4 item it closes.
- **When SparkLayer's docs and this file disagree, SparkLayer's current docs win** — flag the discrepancy so this file gets updated.
- Questions about ERP data (missing prices, stock, customers in SparkLayer) → escalate to Chris; that's the partner's layer, don't debug it.

---

## 6. Merchant implementation playbook (what a launch looks like once the baseline is done)

Per-merchant work is intentionally boring:

1. **Fork/instantiate** from the versioned template core.
2. **`merchant.config.ts`**: name, locale, currency, vatMode, Spark siteId, feature flags, menu handles, logo/favicon paths.
3. **`app/styles/tokens.css`**: brand tokens (colors, fonts, radius) per the design-system theming rules. These two files are the only code a fork edits.
4. **Assets**: logo, favicon, fonts (licensed per merchant).
5. **Shopify admin (merchant store)**: products/collections/menus/pages/policies; install + configure Search & Discovery (filters, synonyms, boosts); create the `sparklayer-authentication` metafield definition **with storefront access**; ensure B2B customers carry the `b2b` tag (partner sync usually handles tagging — verify).
6. **SparkLayer dashboard**: site config, ordering rules, price lists arriving from the partner's ERP sync.
7. **Env**: link Hydrogen to the merchant store, `INTEGRATION_MODE=real`, deploy to Oxygen.
8. **Acceptance run**: the Phase 2 DoD checklist executed against the merchant store, plus content QA (nb-NO copy, VAT labels, legal pages) and Lighthouse re-check on the themed build.

Anything a launch needs that isn't on this list is a gap in the template — file it against core, don't hack it into the fork.
