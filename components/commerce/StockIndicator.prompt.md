Stock + lead-time status for product cards and PDP. Colored dot + Norwegian label.

```jsx
<StockIndicator status="in" leadTime="sendes i dag" />
<StockIndicator status="low" qty={6} />
<StockIndicator status="backorder" leadTime="3–5 virkedager" />
<StockIndicator status="out" />
```

Props: `status` (in/low/out/backorder), `qty` (shown for low), `leadTime`, `label` (override). Maps to status tokens automatically.
