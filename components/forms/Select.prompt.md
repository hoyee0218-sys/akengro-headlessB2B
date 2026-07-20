Native dropdown for sorting, filters, address country, quantity-break presets. Custom chevron, token-styled.

```jsx
<Select placeholder="Sorter etter" options={['Relevans','Pris lav–høy','Pris høy–lav']} />
<Select label="Kostnadssted" options={['Drift','Lager','Prosjekt']} />
<Select options={[{value:'no',label:'Norge'},{value:'se',label:'Sverige'}]} />
```

Props: `options` (strings or {value,label}), `size`, `placeholder`, `label`, `hint`, `error`, `required`. With `label`/`hint`/`error` it renders a full labeled field (like Input); without, just the bordered control. Accepts `<option>` children too.
