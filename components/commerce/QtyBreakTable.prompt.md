Volume/quantity-break price ladder on the PDP. Fed by `getQuantityBreaks` (§7); highlights the tier the current quantity reaches.

```jsx
<QtyBreakTable currentQty={qty} breaks={[
  {minQty:1, price:104},
  {minQty:12, price:98},
  {minQty:144, price:89},
]} />
```

Props: `breaks` ({minQty,price}), `currency`, `locale`, `currentQty` (highlights active tier), `unit`. Shows −% savings vs the base tier.
