Checkbox (and radio via `type="radio"`) for filters, terms, and option groups.

```jsx
<Checkbox label="På lager" defaultChecked />
<Checkbox label="Vis priser eks. mva" description="Standard for bedriftskunder" />
<Checkbox type="radio" name="ship" label="Hent selv" />
<Checkbox indeterminate label="Alle kategorier" />
```

Props: `label`, `description`, `type` (checkbox/radio), `indeterminate`, plus native input props.
