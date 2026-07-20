/* Account kit — B2B power-buyer screens (features 1–8). */

/* ----- Feature 1: Quick order pad / bulk add ----- */
function QuickOrder({ go }) {
  const { Button, Input, DemoDataBadge, Badge } = NS();
  const D = window.DEMO;
  const skuMap = {};
  D.products.forEach(p => { skuMap[p.sku.toUpperCase()] = p; });
  const blank = () => ({ key: Math.random().toString(36).slice(2), sku: '', qty: '' });
  const [rows, setRows] = React.useState([
    { key: 'a', sku: 'VLV-8830-SS', qty: '12' },
    { key: 'b', sku: 'CLP-022-ZN', qty: '100' },
    blank(),
  ]);
  const [paste, setPaste] = React.useState('');

  const resolve = (sku) => skuMap[(sku || '').trim().toUpperCase()] || null;
  const setRow = (key, patch) => setRows(rs => {
    const next = rs.map(r => r.key === key ? { ...r, ...patch } : r);
    if (next[next.length - 1].sku || next[next.length - 1].qty) next.push(blank());
    return next;
  });
  const removeRow = (key) => setRows(rs => rs.filter(r => r.key !== key).concat(rs.length === 1 ? [blank()] : []));

  const applyPaste = () => {
    const parsed = paste.split(/\n/).map(l => l.trim()).filter(Boolean).map(l => {
      const [sku, qty] = l.split(/[\s,;\t]+/);
      return { key: Math.random().toString(36).slice(2), sku: sku || '', qty: qty || '1' };
    });
    if (parsed.length) { setRows(parsed.concat(blank())); setPaste(''); }
  };

  const valid = rows.filter(r => resolve(r.sku) && parseInt(r.qty, 10) > 0);
  const total = valid.reduce((s, r) => s + resolve(r.sku).amount * parseInt(r.qty, 10), 0);
  const totalQty = valid.reduce((s, r) => s + parseInt(r.qty, 10), 0);

  return (
    <div>
      <div className="ac-head">
        <div><h1>Hurtigbestilling</h1><p>Skriv eller lim inn SKU og antall — legg hele kurven til på én gang</p></div>
        <div className="ac-head__actions"><DemoDataBadge /></div>
      </div>
      <div className="ac-qo">
        <div className="ac-card">
          <div className="ac-qo__rows">
            <div className="ac-qo__row ac-qo__row--head"><span>SKU</span><span>Produkt</span><span>Antall</span><span></span></div>
            {rows.map(r => {
              const p = resolve(r.sku);
              return (
                <div className="ac-qo__row" key={r.key}>
                  <Input size="sm" mono placeholder="SKU" value={r.sku} onChange={(e) => setRow(r.key, { sku: e.target.value })} />
                  <div>
                    {p ? <div className="ac-qo__match">{p.title}<div className="sku">{window.money(p.amount, 2)} · {p.cat}</div></div>
                       : r.sku ? <span className="ac-qo__unmatched">Ukjent SKU</span>
                       : <span className="ac-qo__unmatched" style={{ opacity: 0.5 }}>—</span>}
                  </div>
                  <Input size="sm" mono type="number" placeholder="0" value={r.qty} onChange={(e) => setRow(r.key, { qty: e.target.value })} />
                  <button className="ac-qo__rm" aria-label="Fjern" onClick={() => removeRow(r.key)}><Icon name="x" size={15} /></button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="ac-card" style={{ padding: 'var(--space-5)' }}>
            <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Gyldige linjer</span><span>{valid.length}</span></div>
            <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Totalt antall</span><span>{totalQty} stk</span></div>
            <div className="ac-sum ac-sum--total"><span>Sum eks. mva</span><span>{window.money(total, 2)}</span></div>
            <Button block style={{ marginTop: 16 }} disabled={!valid.length} iconStart={<Icon name="shopping-cart" size={16} />} onClick={() => go('checkout')}>Legg {valid.length} varer i kurv</Button>
          </div>
          <div className="ac-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ font: 'var(--weight-semibold) var(--scale-base)/1 var(--font-display)', marginBottom: 4 }}>Lim inn fra regneark</h3>
            <p style={{ font: 'var(--scale-xs)/1.5 var(--font-body)', color: 'var(--text-muted)', marginBottom: 12 }}>Én linje per vare: <span style={{ fontFamily: 'var(--font-mono)' }}>SKU&nbsp;&nbsp;antall</span></p>
            <div className="ac-qo__paste">
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'VLV-8830-SS\t12\nCLP-022-ZN\t100\nFLG-2210-CS\t50'} />
            </div>
            <Button variant="secondary" block style={{ marginTop: 12 }} disabled={!paste.trim()} onClick={applyPaste}>Tolk og fyll inn</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.QuickOrder = QuickOrder;

/* ----- Features 2 + 7: Saved lists & recurring orders ----- */
function SavedLists({ go }) {
  const { Button, Badge } = NS();
  const D = window.DEMO;
  const [open, setOpen] = React.useState(D.savedLists[0].id);
  return (
    <div>
      <div className="ac-head">
        <div><h1>Mine lister</h1><p>Lagrede handlelister og planlagte, gjentakende bestillinger</p></div>
        <div className="ac-head__actions"><Button iconStart={<Icon name="plus" size={16} />}>Ny liste</Button></div>
      </div>
      <div className="ac-lists">
        {D.savedLists.map(l => {
          const isOpen = open === l.id;
          return (
            <div className="ac-list" key={l.id}>
              <div className="ac-list__head" onClick={() => setOpen(isOpen ? null : l.id)}>
                <Icon name="chevron-right" size={18} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                <div>
                  <div className="ac-list__title">{l.name}</div>
                  <div className="ac-list__meta">{l.items.length} varer · {window.money(l.total)} · eier {l.owner}</div>
                </div>
                <div className="ac-list__spacer" />
                {l.schedule && <Badge tone="info" dot>{l.schedule}{l.nextRun ? ` · neste ${l.nextRun}` : ''}</Badge>}
                <Button size="sm" variant="secondary" iconStart={<Icon name="rotate-cw" size={14} />} onClick={(e) => { e.stopPropagation(); go('checkout'); }}>Legg i kurv</Button>
              </div>
              {isOpen && (
                <div className="ac-list__lines">
                  <table className="ac-table">
                    <thead><tr><th>Produkt</th><th>SKU</th><th className="num">Antall</th><th className="num">Pris</th><th className="num">Sum</th></tr></thead>
                    <tbody>
                      {l.lines.map(ln => (
                        <tr key={ln.sku}>
                          <td style={{ fontWeight: 'var(--weight-medium)' }}>{ln.product.title}</td>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>{ln.sku}</td>
                          <td className="num">{ln.qty}</td>
                          <td className="num">{window.money(ln.product.amount, 2)}</td>
                          <td className="num">{window.money(ln.product.amount * ln.qty, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {l.schedule && (
                    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 'var(--scale-sm)' }}>
                      <Icon name="calendar-clock" size={15} /> Planlagt levering {l.schedule.toLowerCase()} · neste {l.nextRun}
                      <Button size="sm" variant="ghost" style={{ marginLeft: 'auto' }}>Endre plan</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.SavedLists = SavedLists;

/* ----- Feature 4: Users + approval workflow ----- */
function Users() {
  const { Button, Badge, DemoDataBadge } = NS();
  const D = window.DEMO;
  return (
    <div>
      <div className="ac-head">
        <div><h1>Brukere &amp; godkjenning</h1><p>Teammedlemmer, roller og bestillinger som venter på godkjenning</p></div>
        <div className="ac-head__actions"><DemoDataBadge /><Button iconStart={<Icon name="user-plus" size={16} />}>Inviter bruker</Button></div>
      </div>

      {D.approvals.length > 0 && (
        <div className="ac-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="ac-card__head"><h3>Venter på godkjenning ({D.approvals.length})</h3></div>
          {D.approvals.map(a => (
            <div className="ac-approval" key={a.id}>
              <Icon name="clock" size={18} style={{ color: 'var(--status-warning)' }} />
              <div className="ac-approval__main">
                <div className="ac-approval__t">{a.id} · {a.by}</div>
                <div className="ac-approval__sub">{a.date} · {a.lines} varelinjer{a.ref ? ` · ${a.ref}` : ''}{a.note ? ` · «${a.note}»` : ''}</div>
              </div>
              <span className="ac-approval__amt">{window.money(a.total)}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="secondary">Avvis</Button>
                <Button size="sm" iconStart={<Icon name="check" size={14} />}>Godkjenn</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ac-card">
        <div className="ac-card__head"><h3>Teammedlemmer</h3></div>
        <table className="ac-table">
          <thead><tr><th>Bruker</th><th>Rolle</th><th className="num">Bestillingsgrense</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {D.users.map(u => (
              <tr key={u.id}>
                <td><div className="ac-user"><span className="ac-avatar">{u.initials}</span><div><div className="ac-user__name">{u.name}</div><div className="ac-user__email">{u.email}</div></div></div></td>
                <td>{u.role}</td>
                <td className="num">{u.limit == null ? <span style={{ color: 'var(--text-muted)' }}>Ubegrenset</span> : window.money(u.limit)}</td>
                <td>{u.status === 'active' ? <Badge tone="success" dot>Aktiv</Badge> : <Badge tone="warning" dot>Invitert</Badge>}</td>
                <td className="num"><Button size="sm" variant="ghost">Rediger</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ac-roles">
        {Object.keys(D.roles).map(r => (
          <div className="ac-role" key={r}><h4>{r}</h4><p>{D.roles[r]}</p></div>
        ))}
      </div>
    </div>
  );
}
window.Users = Users;

/* ----- Feature 6: Notifications + back-in-stock watch ----- */
function Notifications() {
  const { Button, Badge, StockIndicator } = NS();
  const D = window.DEMO;
  const ICON = { 'back-in-stock': 'package-check', order: 'truck', approval: 'clock', invoice: 'triangle-alert', quote: 'file-text' };
  return (
    <div>
      <div className="ac-head">
        <div><h1>Varslinger</h1><p>Hendelser på kontoen og varer du følger</p></div>
        <div className="ac-head__actions"><Button variant="ghost" size="sm">Merk alle som lest</Button></div>
      </div>
      <div className="ac-grid2">
        <div className="ac-card">
          <div className="ac-card__head"><h3>Nylig</h3></div>
          {D.notifications.map(n => (
            <div className="ac-notif" key={n.id}>
              <span className="ac-notif__ico"><Icon name={ICON[n.type] || 'bell'} size={16} /></span>
              <div className="ac-notif__body">
                <div className="ac-notif__t">{n.product ? <b>{n.product.title}</b> : <b>{n.ref}</b>} {n.text}</div>
                <div className="ac-notif__d">{n.date}</div>
              </div>
              {!n.read && <span className="ac-notif__unread" />}
            </div>
          ))}
        </div>
        <div className="ac-card">
          <div className="ac-card__head"><h3>Følger lagerstatus</h3></div>
          <div style={{ padding: '4px 0' }}>
            {D.backInStockWatch.map(w => (
              <div key={w.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--weight-medium) var(--scale-sm)/1.3 var(--font-body)' }}>{w.product.title}</div>
                  <div style={{ marginTop: 4 }}><StockIndicator status={w.product.stock} leadTime={w.product.lead} /></div>
                </div>
                <Button size="sm" variant="ghost" iconStart={<Icon name="bell-off" size={14} />}>Slutt å følge</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.Notifications = Notifications;

/* ----- Feature 8: Quote detail + quote→order conversion ----- */
function QuoteDetail({ id, go }) {
  const { Button, OrderStatusBadge, DemoDataBadge } = NS();
  const D = window.DEMO;
  const q = D.quotes.find(x => x.id === id) || D.quotes[0];
  const lines = D.quoteLines[q.id] || [];
  const [converted, setConverted] = React.useState(false);
  const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const list = lines.reduce((s, l) => s + l.product.listAmount * l.qty, 0);
  const vat = Math.round(sub * 0.25);
  return (
    <div>
      <button className="ac-back" onClick={() => go('quotes')}><Icon name="arrow-left" size={15} />Tilbake til tilbud</button>
      {converted && (
        <div className="ac-banner"><Icon name="circle-check" size={18} />Tilbud {q.id} er godtatt og konvertert til ordre #NO-104890. <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.8 }}>(DEMO – order-create seam §7)</span></div>
      )}
      <div className="ac-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><h1>Tilbud #{q.id}</h1><OrderStatusBadge status={converted ? 'confirmed' : q.status} /></div>
          <p>{q.date} · gyldig til {q.valid}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button variant="secondary" iconStart={<Icon name="file-down" size={16} />}>Last ned PDF</Button>
          <Button disabled={converted} iconStart={<Icon name="check" size={16} />} onClick={() => { setConverted(true); window.scrollTo(0, 0); }}>Godta og bestill</Button>
        </div>
      </div>
      <div className="ac-detail">
        <div className="ac-card">
          <table className="ac-table">
            <thead><tr><th>Produkt</th><th>SKU</th><th className="num">Antall</th><th className="num">Listepris</th><th className="num">Tilbudspris</th><th className="num">Sum</th></tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.sku}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>{l.product.title}</td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{l.sku}</td>
                  <td className="num">{l.qty}</td>
                  <td className="num" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{window.money(l.product.listAmount, 2)}</td>
                  <td className="num" style={{ fontWeight: 'var(--weight-semibold)' }}>{window.money(l.price, 2)}</td>
                  <td className="num">{window.money(l.price * l.qty, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ac-card" style={{ padding: 'var(--space-5)' }}>
          <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Ordinær sum</span><span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{window.money(list, 2)}</span></div>
          <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Tilbudssum eks. mva</span><span>{window.money(sub, 2)}</span></div>
          <div className="ac-sum"><span style={{ color: 'var(--status-success-fg)' }}>Du sparer</span><span style={{ color: 'var(--status-success-fg)' }}>{window.money(list - sub, 2)}</span></div>
          <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>MVA 25%</span><span>{window.money(vat, 2)}</span></div>
          <div className="ac-sum ac-sum--total"><span>Totalt</span><span>{window.money(sub + vat, 2)}</span></div>
        </div>
      </div>
    </div>
  );
}
window.QuoteDetail = QuoteDetail;
