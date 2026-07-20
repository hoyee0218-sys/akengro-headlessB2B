Small status/label pill — stock state, order state, "DEMO DATA"-adjacent flags, category labels.

```jsx
<Badge tone="success" dot>På lager</Badge>
<Badge tone="warning" dot>Få igjen</Badge>
<Badge tone="info">Bestilt</Badge>
<Badge tone="outline">Netto 30</Badge>
```

Tones: `neutral` (default) · `success` · `warning` · `danger` · `info` · `outline` · `solid`. Use `dot` for a leading status dot. For order-state specifically, prefer `OrderStatusBadge` which maps states to tones automatically.
