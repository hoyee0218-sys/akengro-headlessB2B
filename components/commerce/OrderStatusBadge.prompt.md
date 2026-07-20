Order-state badge for order history/detail. Maps each state to the correct tone + Norwegian label automatically (built on Badge).

```jsx
<OrderStatusBadge status="shipped" />     {/* På vei */}
<OrderStatusBadge status="overdue" />     {/* Forfalt (danger) */}
<OrderStatusBadge status="quote" />       {/* Tilbud */}
```

States: draft, quote, pending, confirmed, processing, shipped, delivered, invoiced, paid, overdue, cancelled, returned. Props: `status`, `label` (override), `dot`.
