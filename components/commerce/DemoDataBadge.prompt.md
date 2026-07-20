The "DEMO DATA" marker for the partner demo (§7). Put it on any surface whose values come from a mock provider (prices, orders, credit, quotes) so it's clear what's real vs stubbed.

```jsx
<DemoDataBadge />
<DemoDataBadge corner />                    {/* pins to a relative container */}
<DemoDataBadge label="Mock pris" />
```

Props: `corner` (absolute top-right), `label`. Dashed amber chip — intentionally distinct from real status badges.
