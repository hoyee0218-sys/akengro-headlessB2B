The catalog product card for PLP grids. Entitlement-aware: price + add-to-cart hide when `gated`.

```jsx
<ProductCard title="Kuleventil DN25 rustfritt" sku="VLV-8830-SS"
  amount={1248} listAmount={1390} stockStatus="in" leadTime="sendes i dag"
  onAddToCart={add} />

<ProductCard title="Flensepakning EPDM" sku="FLG-2210" gated />      {/* logged out */}
<ProductCard title="Rørklemme 22mm" sku="CLP-022" stockStatus="out" amount={89} />
```

Props: `title`, `sku`, `image`, `amount`/`listAmount`, `currency`, `locale`, `vatMode`, `gated`, `stockStatus`, `leadTime`, `onAddToCart`, `href`, `cta`. Composes PriceDisplay + StockIndicator + Button — don't re-implement those inside a kit.
