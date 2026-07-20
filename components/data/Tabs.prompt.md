Underline tab bar for account sections ("Mine sider") and PDP detail panels. Controlled.

```jsx
const [tab, setTab] = React.useState('alle');
<Tabs value={tab} onChange={setTab} tabs={[
  {value:'alle', label:'Alle', count:128},
  {value:'apen', label:'Åpne', count:4},
  {value:'levert', label:'Levert'},
]} />
```

Props: `tabs` (strings or {value,label,count}), `value`, `onChange`. Render the active panel yourself based on `value`.
