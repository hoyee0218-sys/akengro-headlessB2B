Toggle for instant on/off settings — VAT display mode, email notifications, reorder reminders.

```jsx
<Switch label="Vis priser inkl. mva" defaultChecked />
<Switch label="E-postvarsler" />
```

Props: `label` + native checkbox props (`checked`, `onChange`, `disabled`). Use Checkbox (not Switch) inside forms that submit; use Switch for immediate-effect preferences.
