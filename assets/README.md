# assets/

Brand and media assets for the template. The template ships **no merchant logo
or imagery by design** — an un-themed fork is intentionally blank.

## What a merchant fork drops here
- `logo.svg` (+ `logo-mono.svg` for on-ink contexts) — referenced by
  `merchant.config.logo.src`.
- `favicon.ico` / `favicon.svg`.
- Product & lifestyle imagery (optional). Treat product shots on neutral
  backgrounds; the system uses flat surfaces, no decorative imagery behind text.

## Icons
Icons are **not** stored here. The system uses [Lucide](https://lucide.dev)
(outline, 1.75px stroke) loaded from CDN in previews. In production, import only
the icons used so the Oxygen worker bundle stays lean. See the README
"ICONOGRAPHY" section. If a merchant has its own icon set, replace Lucide and
update that section.

> ⚠️ Substitution flag: Lucide is a substitute — no icon set was provided with
> the source brief.
