# Headless B2B Storefront — Hydrogen demo (SparkLayer-ready)

A **fork-ready Hydrogen + Oxygen** B2B storefront built on the Headless B2B
design system. It looks and navigates like a real B2B store (Norwegian, VVS
wholesale) and is architected so **SparkLayer + Shopify Customer Account API +
the ERP partner sync drop into clearly-defined seams with zero refactor**.

This is the demo pass described in `../setup.md` (BUILD.md). The "critical 30%"
(real checkout, auth→entitlement, ERP/SparkLayer data) is **stubbed behind a
mock layer**; every mocked value carries a visible `DEMO DATA` badge.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (INTEGRATION_MODE=mock)
npm run build      # Oxygen build — worker ~0.5 MB (budget 10 MB)
npm run typecheck
npm run test       # entitlement-bridge + real-mode boundary tests
```

Demo login: `/account/login` → "Logg inn som demo-bruker" (Marius Hansen @
Bergen Rør & VVS AS). Logged out, prices are gated ("Logg inn for pris").

## Routes

| Path | Screen |
|------|--------|
| `/` | Home (hero + entitlement-aware account panel + catalog) |
| `/collections/:handle` | PLP — Shopify collection + **server-side entitlement/price overlay** |
| `/products/:handle` | PDP — price + qty-break slot; add-to-cart → **B2B cart seam** |
| `/checkout` | Cart review + order-create handoff (**stubbed**) |
| `/account/login` · `/account/logout` | Custom login UI (identity = Shopify Customer Account API) |
| `/account` | "Mine sider": dashboard, hurtigbestilling, mine lister, ordrer (+detalj), tilbud (+→ordre), prisliste, kreditt, brukere+godkjenning, varslinger |

## Architecture

```
app/
  merchant.config.ts            ← per-merchant config (one of TWO files a fork edits)
  styles/
    tokens.css + tokens/*.css   ← design-system tokens (the OTHER file a fork edits)
    spark.css                   ← our tokens → SparkLayer --b2b-* vars (single Spark theme file)
    components.css              ← DS component CSS (static; no CSS-in-JS runtime on Oxygen)
    storefront.css / account.css← ported UI-kit chrome
  components/ds/                ← ported design-system core (Button…ProductCard, DemoDataBadge)
  components/                   ← StorefrontChrome, AccountChrome, B2BLayout (app shell)
  lib/
    entitlement.ts              ← THE BRIDGE: shopifyUser → entitlements (core, TESTED)
    entitlement.test.ts         ← isolation boundary tests (fleet-critical)
    auth.ts                     ← demo session standing in for Customer Account API
    cart.ts                     ← B2B cart (stands in for SparkLayer cart)
    catalog.ts                  ← entitlement + price overlay (the §4 single function)
    seams/
      types.ts                  ← typed seam contracts (§5)
      fixtures.ts               ← demo data, ported from the UI kits
      mock.ts / real.ts         ← Mock providers (demo) / Real stubs (throw NotImplemented)
      index.ts                  ← getSeams(env) — selects by INTEGRATION_MODE
```

### Integration seams (`INTEGRATION_MODE=mock|real`)

- **mock** (default): fully-populated, navigable demo. Every provider returns
  fixture data → `DemoDataBadge`.
- **real**: compiles; every `RealProvider` throws `NotImplemented` with the
  **owner** named (SparkLayer / Shopify Customer Account API / Shopify Admin /
  Shopify Storefront API) — so the seams are *visible*, not hidden.

Providers: `PricingProvider`, `EntitlementProvider`, `CatalogProvider`,
`OrderProvider`, `AccountDataProvider`. **All are called from loaders/actions
only** — never from client identity.

### The entitlement bridge (the differentiator, §6)

`resolveEntitlementsForUser(shopifyUser) → {companyId, priceListIds, permissions}`
is the single resolution path, lives in core, and is the most-tested code here.
Two demo companies (Bergen / Oslo) are modelled so the **cross-customer
isolation** guarantee is real and tested: a buyer never resolves to another
company's price list or permissions. Price/order/quote resolution is
**server-side only**.

### Notes for the next pass

- Catalog/menu in `mock` come from fixtures + a fallback; in `real` they come
  from the Shopify Storefront API (`collection(handle){products}`, `menu`).
- Fonts: the design system loads Archivo / IBM Plex via Google Fonts `@import`
  (`app/styles/tokens/fonts.css`). For production, self-host woff2 and replace
  the `@import` with local `@font-face` (Oxygen budget / no render-blocking 3p).
- Demo login replaces the Customer Account API OAuth flow only at `lib/auth.ts`;
  the `ShopifyAuthedUser` shape handed to the bridge is identical to the real one.
