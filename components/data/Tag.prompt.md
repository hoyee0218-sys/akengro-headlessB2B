Filter/facet chip for PLP filtering and active-filter bars. Selectable (toggle) and/or removable.

```jsx
<Tag selected onClick={toggle}>Rustfritt stål</Tag>
<Tag onClick={toggle}>Messing</Tag>
<Tag onRemove={clearFilter}>På lager</Tag>
```

Props: `selected`, `onClick` (makes it a toggle button), `onRemove` (renders ×). Use for facets and applied-filter pills; use Badge for non-interactive status.
