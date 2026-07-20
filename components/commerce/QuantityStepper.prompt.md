Quantity input with −/+ for PDP and cart lines. Supports min/max and `step` for case/pack quantities.

```jsx
<QuantityStepper defaultValue={12} step={12} unit="stk" onChange={setQty} />
<QuantityStepper value={qty} min={1} max={500} onChange={setQty} size="sm" />
```

Props: `value`/`defaultValue`, `min`, `max`, `step`, `unit`, `size`, `onChange`. Use `step` to enforce wholesale case multiples.
