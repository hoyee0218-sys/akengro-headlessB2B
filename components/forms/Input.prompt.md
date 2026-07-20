Text field for forms (login, address, search, quantity entry). Wraps label + hint/error so fields are consistent.

```jsx
<Input label="E-post" type="email" required placeholder="navn@bedrift.no" />
<Input label="Antall" mono suffix="stk" defaultValue="12" />
<Input label="Passord" type="password" error="Feil passord" />
<Input prefix={<SearchIcon/>} placeholder="Søk SKU eller produkt" />
```

Props: `label`, `hint`, `error`, `required`, `size` (sm/md/lg), `prefix`, `suffix`, `mono`. Without label/hint/error it renders just the bordered input (use inside custom layouts/search bars).
