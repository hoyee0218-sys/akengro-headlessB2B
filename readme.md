# Headless B2B Storefront — Design System

A **template** design system for a productized, fork-ready headless B2B storefront
(Shopify Hydrogen + Oxygen, SparkLayer B2B engine, ERP integration via a partner seam).
This is the visual + component foundation that every merchant fork inherits.

> **Built by** scandicommerce. **This design system is NOT the scandicommerce brand.**
> The agency identity (Space Grotesk / `#1EEFFA`) is deliberately kept out. Everything
> here is a *neutral, intentionally-blank placeholder* so an un-themed fork looks
> deliberately unstyled — not accidentally branded. Each merchant overrides the
> `--brand-*` and `--font-*` tokens to get a distinctive, sector-appropriate direction.

---

## Sources

No external codebase or Figma was provided. The single source of truth is the
**"Headless B2B Storefront — Design System & Generation Brief"** supplied by the user
(the productized template brief covering layer ownership, tokens, component inventory,
fleet architecture, auth/entitlement bridge, Norwegian/B2B specifics, integration
seams, and Oxygen runtime constraints). If a reference storefront repo or Figma file
exists, attach it and this system can be aligned to it precisely.

---

## What this is (product context)

- **Owner of this layer:** scandicommerce — we generate the storefront UI, the custom
  B2B customer-account experience ("Mine sider" / My Pages), and the auth→entitlement
  bridge. We do **not** build the B2B pricing engine (SparkLayer), the ERP sync
  (integration partner), or auth primitives (Shopify Customer Account API).
- **Fleet model:** a versioned shared *core* + thin per-merchant repos. A merchant fork
  is re-skinned by editing **one token file** (`app/styles/tokens.css`) plus
  `merchant.config.ts`. A platform fix is "bump core → redeploy", fleet-wide.
- **Demo discipline:** the first build is a *demo-grade* storefront for an ERP
  integration partner. Checkout, real auth→entitlement, and ERP/SparkLayer data are
  **stubbed behind clearly-labelled mock seams** (a subtle "DEMO DATA" marker), not
  faked as complete.

---

## Aesthetic direction (template default)

**Utilitarian-precise, neutral.** Monochrome by default (ink + cool-gray ramp +
functional status colors), hairline borders over heavy rounding, restrained elevation,
fast no-bounce motion. Type pairing: **Archivo** (display) · **IBM Plex Sans** (body)
· **IBM Plex Mono** (SKUs, order numbers, prices). The direction reads as a confident,
technical B2B foundation that any merchant brand can sit on top of.

Merchants pick their own bold direction at theme time — see §2 of the brief.

---

## CONTENT FUNDAMENTALS (copy & tone)

The template ships **bilingual-ready** copy with **Norwegian (nb-NO) as the default
locale**; everything is i18n-ready (currency NOK, dates/stock/order-state language in
Norwegian). Tone is **plain, direct, and professional** — B2B buyers are doing a job,
not browsing for fun.

- **Voice:** second person, addressing the buyer's company ("din bedrift" / "your
  account"). Calm and factual; no hype, no exclamation marks, no emoji.
- **Casing:** Sentence case for headings and buttons (`Legg i handlekurv`, not
  `LEGG I HANDLEKURV`). UPPERCASE is reserved for small eyebrow/label microtext with
  wide tracking (`KATALOG`, `MINE SIDER`).
- **Verbs:** action-first, imperative on buttons — `Legg i kurv`, `Be om tilbud`,
  `Bestill på nytt`, `Last ned faktura`.
- **Numbers & money:** Norwegian formatting — space as thousands separator, comma as
  decimal, `kr`/`NOK` after the amount: `14 976,00 kr`. Always rendered in
  `--font-mono` with tabular figures so columns align. Never imply a price the order
  won't honour; respect `vatMode` (ex-VAT label `eks. mva` for B2B by default).
- **Status language (Norwegian default):** `På lager`, `Få igjen`, `Utsolgt`,
  `Bestilt`, `På vei`, `Levert`, `Tilbud`, `Forfalt`. English equivalents via i18n.
- **DEMO DATA marker:** literal, unembellished — a small amber chip reading
  `DEMO DATA` so the partner always knows which values are mocked.

Example microcopy:
> `KATALOG` · "Ventiler og koblinger" · "Priser vises eks. mva for din bedrift." ·
> button `Be om tilbud` · stock `På lager – sendes i dag`.

---

## VISUAL FOUNDATIONS

- **Color vibe:** monochrome-first. Ink `#1C2024` is the placeholder brand color;
  surfaces are white over a cool-gray sunken `#F4F6F8`. The only chromatic accents are
  the single placeholder `--brand-accent` (muted industrial blue `#2D5BD6`, used
  sparingly) and the four **status** colors (green/amber/red/blue) which carry real
  meaning (stock, order state, credit). Merchants inject their hue via `--brand-*`.
- **Type:** display in Archivo with tight tracking (`-0.02em`) at heavy weights
  (700–800) for impact; body in IBM Plex Sans 450–600; mono in IBM Plex Mono for any
  identifier or money. Eyebrows are 11–12px uppercase, `0.08em` tracking, muted.
- **Spacing:** strict 4px grid (`--space-*`). Generous outer padding, tight internal
  rhythm in dense tables. Container max 1280px.
- **Backgrounds:** flat fills only — no gradients, no decorative imagery behind text,
  no patterns. Atmosphere comes from precise alignment and the gray/white contrast,
  not texture. Product imagery is the only imagery; treat it on neutral backgrounds.
- **Borders:** hairline `--border-subtle` (#E4E8EC) does most structural work;
  `--border-strong` for emphasis and outlined controls. This is a border-led system,
  not a shadow-led one.
- **Corner radii:** small and precise — controls `4px`, cards `6px`, overlays `10px`.
  Pills only for status chips and counts. Avoid large rounded "friendly" cards.
- **Cards:** white surface, `1px` subtle border, `6px` radius, `--shadow-sm` at rest;
  lift to `--shadow-md` on hover for interactive cards. No colored left-border accents.
- **Elevation:** subtle, cool-tinted shadows (`xs`→`xl`); most UI sits flat with a
  border. Overlays (dialogs, popovers) use `--shadow-lg/xl`.
- **Motion:** fast and functional — `120ms` for controls, `200ms` base, `320ms` for
  overlays; easing `cubic-bezier(0.2,0,0,1)`. No bounce, no spring. Honors
  `prefers-reduced-motion` (durations collapse to 0).
- **Hover states:** buttons darken (`--brand-primary-hover`); ghost/secondary fill with
  `--surface-sunken`; cards raise shadow. **Press:** a 0.5px nudge (`translateY`), no
  scale. **Focus:** a 3px accent-tinted ring (`--ring`) on every interactive control.
- **Transparency & blur:** used sparingly — dialog scrims and the focus-ring use
  `color-mix` alphas; no frosted-glass surfaces in the default theme.

---

## ICONOGRAPHY

No icon set was provided with the brief. The template **substitutes
[Lucide](https://lucide.dev)** — outline icons, 1.5–2px stroke, 24px grid — which
matches the utilitarian-precise, technical direction. Used via the Lucide UMD build in
cards/kits (`<i data-lucide="search"></i>` + `lucide.createIcons()`); in production,
import only the icons used to keep the Oxygen bundle lean.

- **Style:** line/outline only, never filled or duotone. Stroke icons sit at 16–20px
  inline with text, 24px for standalone actions.
- **No emoji, ever** — B2B/utilitarian tone. No decorative unicode glyphs as icons.
- **Status dots** (8px filled circles in status colors) are the one "iconographic"
  exception used in stock/order chips.
- **⚠️ Substitution flag:** if the merchant or a reference repo has its own icon set,
  swap Lucide out and update this section.

---

## Index (manifest)

**Root**
- `styles.css` — global entry point; `@import` list only. Consumers link this one file.
- `readme.md` — this guide. · `SKILL.md` — Agent-Skill wrapper.
- `merchant.config.example.ts` — non-visual per-merchant config shape (§1).

**`tokens/`** — CSS custom properties (reached from `styles.css`)
- `fonts.css` (placeholder typefaces) · `colors.css` · `typography.css` · `spacing.css`
  · `radius.css` · `shadow.css` · `motion.css` · `base.css` (element defaults)
  · `spark-mapping.css` (maps our tokens → SparkLayer `--b2b-*` vars).

**`guidelines/`** — foundation specimen cards (Design System tab)
- Colors: brand, neutrals, status, surfaces · Type: display, body, mono ·
  Spacing: scale, radius, elevation.

**`components/`** — reusable React core (themeable via tokens)
- `buttons/` — Button, IconButton
- `forms/` — Input, Select, Checkbox, Switch
- `data/` — Badge, Tag, Card, Tabs
- `commerce/` — PriceDisplay, StockIndicator, QuantityStepper, QtyBreakTable,
  ProductCard, OrderStatusBadge, DemoDataBadge

**`ui_kits/`** — full-screen recreations
- `storefront/` — Home, PLP (collection), PDP, **Checkout** (PO no. · cost center · multi ship-to · invoice/card · order-create seam)
- `account/` — "Mine sider": dashboard (reorder-from-history), **Hurtigbestilling** (quick order pad + CSV paste), **Mine lister** (saved lists + recurring orders), orders + order detail, **Tilbud → ordre** (quote conversion), price list, credit, **Brukere** (users + approval workflow), **Varslinger** (notifications + back-in-stock watch)

See each component's `.prompt.md` for usage and the Design System tab for live cards.
