---
name: b2b-storefront-design
description: Use this skill to generate well-branded interfaces and assets for the Headless B2B Storefront template (Shopify Hydrogen + SparkLayer + Oxygen, built by scandicommerce), either for production storefront code or throwaway prototypes/mocks/comps. Contains the design tokens, type/colour system, fonts, components, and full storefront + B2B account UI kits. The template defaults are NEUTRAL placeholders — re-skin per merchant by overriding --brand-* and --font-* tokens.
user-invocable: true
---

Read the `readme.md` file within this skill, then explore the other files.

Key facts:
- This is a **template** design system. Defaults are deliberately neutral/monochrome
  (ink + cool grays + status colours; Archivo / IBM Plex Sans / IBM Plex Mono). Do
  NOT treat the defaults as a final brand — each merchant gets a distinctive direction
  by overriding the `--brand-*` and `--font-*` tokens (`tokens/colors.css`,
  `tokens/typography.css`). Never bake in scandicommerce's agency brand.
- Global CSS entry point is `styles.css` (an `@import` list reaching every token +
  font file). Link this one file.
- Components live in `components/<group>/` as `<Name>.jsx` + `<Name>.d.ts` +
  `<Name>.prompt.md`. Read the `.prompt.md` for usage. The B2B differentiators are in
  `components/commerce/` (PriceDisplay, StockIndicator, QuantityStepper, QtyBreakTable,
  ProductCard, OrderStatusBadge, DemoDataBadge).
- Full-screen recreations are in `ui_kits/storefront/` (Home, PLP, PDP) and
  `ui_kits/account/` (My Pages: dashboard, orders, order detail, price list, credit).
- B2B specifics: locale `nb-NO`, currency `NOK`, VAT mode ex/inc, Norwegian status
  language, prices in `--font-mono`. Entitlement-aware pricing is server-resolved;
  mock/demo data carries a `DemoDataBadge` (§7 integration seams).

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out
and create static HTML files for the user to view; load components either from the
compiled bundle (`_ds_bundle.js` in the live DS tab) or, for standalone preview, via
the `_ds-preview-shim.js` pattern the UI kits use. If working on production code, copy
assets and read the rules here to become an expert in designing with this template.

If the user invokes this skill without other guidance, ask what they want to build
(which merchant? production or mock? which surfaces?), ask a few focused questions,
then act as an expert designer who outputs HTML artifacts *or* production-shaped code.
