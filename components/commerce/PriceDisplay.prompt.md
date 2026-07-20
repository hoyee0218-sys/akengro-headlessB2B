Entitlement-aware price slot used in product cards, PDP, cart, and order lines. Always fed by the server-side PricingProvider (§7) — never compute price on the client.

```jsx
<PriceDisplay amount={1248} vatMode="ex" size="lg" />
<PriceDisplay amount={1064} listAmount={1248} vatMode="ex" />  {/* your-price vs list */}
<PriceDisplay gated />                                          {/* not logged in */}
```

Props: `amount` (null → gated), `listAmount` (strikethrough + −% "din pris"), `currency` (NOK), `locale` (nb-NO), `vatMode` (ex/inc), `size`, `gated`. Renders in `--font-mono` with tabular figures and a small VAT label.
