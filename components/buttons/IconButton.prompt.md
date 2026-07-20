Square icon-only control for headers and toolbars (search, account, cart). Always pass `label` for accessibility.

```jsx
<IconButton label="Søk"><SearchIcon/></IconButton>
<IconButton label="Handlekurv" badge={3}><CartIcon/></IconButton>
<IconButton variant="outlined" label="Filtre"><FilterIcon/></IconButton>
```

Variants: `ghost` (default) · `outlined` · `solid`. Sizes match Button: `sm`/`md`/`lg`. Use `badge` for cart/notification counts.
