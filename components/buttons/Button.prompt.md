The primary action control — use for any button or button-styled link across the storefront and account layer.

```jsx
<Button variant="primary" size="md" onClick={addToCart}>Legg i handlekurv</Button>
<Button variant="secondary" iconStart={<PlusIcon/>}>Ny ordre</Button>
<Button variant="accent" as="a" href="/konto">Mine sider</Button>
<Button variant="ghost" size="sm">Avbryt</Button>
<Button loading>Sender…</Button>
```

Variants: `primary` (ink, default) · `secondary` (outlined) · `ghost` (text) · `accent` (merchant spot color) · `danger`.
Sizes: `sm` (32) · `md` (40) · `lg` (48). Props: `block`, `loading`, `disabled`, `iconStart`, `iconEnd`, `as`.

Use `primary` for the single dominant action per view; `secondary`/`ghost` for the rest. Reserve `accent` for marketing/CTA surfaces and `danger` for destructive confirmation.
