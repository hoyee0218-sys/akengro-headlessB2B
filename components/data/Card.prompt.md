Surface container for dashboard tiles, account panels, and grouped content. Border-led, low elevation.

```jsx
<Card title="Siste ordrer" headerAction={<Button variant="ghost" size="sm">Se alle</Button>}>
  …
</Card>
<Card elevation="raised" interactive onClick={open}>…</Card>
<Card padded={false}><table>…</table></Card>
```

Props: `elevation` (flat/raised) · `interactive` · `title` · `headerAction` · `footer` · `padded`. Set `padded={false}` for edge-to-edge tables or media.
