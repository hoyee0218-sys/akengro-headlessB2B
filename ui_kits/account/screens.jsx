/* Account kit — screens. */

function Dashboard({ go, openOrder }) {
  const { Button, OrderStatusBadge, DemoDataBadge } = NS();
  const D = window.DEMO;
  const co = D.company;
  const open = D.orders.filter(o => ['shipped', 'confirmed', 'processing', 'pending'].includes(o.status)).length;
  const overdue = D.orders.filter(o => o.status === 'overdue');
  const creditFree = co.credit.limit - co.credit.used;
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>God morgen, Marius</h1>
          <p>{co.name} · prisliste {co.priceList} · betalingsvilkår {co.terms}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button iconStart={<Icon name="plus" size={16} />} onClick={() => { window.location.href = '../storefront/index.html'; }}>Ny bestilling</Button>
        </div>
      </div>

      <div className="ac-kpis">
        <div className="ac-kpi"><span className="ac-kpi__k"><Icon name="package" size={15} />Åpne ordrer</span><span className="ac-kpi__v">{open}</span><span className="ac-kpi__sub">2 sendes denne uken</span></div>
        <div className="ac-kpi"><span className="ac-kpi__k"><Icon name="file-text" size={15} />Aktive tilbud</span><span className="ac-kpi__v">{D.quotes.length}</span><span className="ac-kpi__sub">1 utløper 17.06</span></div>
        <div className="ac-kpi"><span className="ac-kpi__k"><Icon name="triangle-alert" size={15} />Forfalt</span><span className="ac-kpi__v" style={{ color: overdue.length ? 'var(--status-danger)' : 'inherit' }}>{window.money(overdue.reduce((s, o) => s + o.total, 0))}</span><span className="ac-kpi__sub">{overdue.length} faktura</span></div>
        <div className="ac-kpi">
          <span className="ac-kpi__k"><Icon name="wallet" size={15} />Kreditt ledig</span>
          <span className="ac-kpi__v">{window.money(creditFree)}</span>
          <div className="ac-credit__track"><div className="ac-credit__fill" style={{ width: (co.credit.used / co.credit.limit * 100) + '%' }} /></div>
        </div>
      </div>

      <div className="ac-grid2">
        <div className="ac-card">
          <div className="ac-card__head"><h3>Siste ordrer</h3><Button variant="ghost" size="sm" onClick={() => go('orders')} iconEnd={<Icon name="arrow-right" size={15} />}>Alle ordrer</Button></div>
          <table className="ac-table">
            <thead><tr><th>Ordre</th><th>Dato</th><th>Status</th><th className="num">Beløp</th></tr></thead>
            <tbody>
              {D.orders.slice(0, 4).map(o => (
                <tr key={o.id} className="is-click" onClick={() => openOrder(o.id)}>
                  <td className="mono">#{o.id}</td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{o.date}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="num">{window.money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ac-card">
          <div className="ac-card__head"><h3>Bestilt oftest</h3><Button variant="ghost" size="sm" onClick={() => go('quickorder')} iconEnd={<Icon name="arrow-right" size={15} />}>Hurtigbestilling</Button></div>
          <div style={{ padding: 'var(--space-2) 0' }}>
            {D.reorderHistory.slice(0, 4).map(r => (
              <div key={r.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--weight-medium) var(--scale-sm)/1.3 var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.product.title}</div>
                  <div style={{ font: 'var(--scale-2xs)/1 var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{r.sku} · sist {r.lastOrdered} · {r.times}×</div>
                </div>
                <Button size="sm" variant="secondary" iconStart={<Icon name="rotate-cw" size={14} />}>{r.lastQty} stk</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;

function Orders({ openOrder }) {
  const { OrderStatusBadge, Tabs, Button } = NS();
  const D = window.DEMO;
  const [tab, setTab] = React.useState('alle');
  const groups = { alle: () => true, apen: o => ['shipped', 'confirmed', 'processing', 'pending'].includes(o.status), levert: o => o.status === 'delivered', forfalt: o => o.status === 'overdue' };
  const list = D.orders.filter(groups[tab]);
  return (
    <div>
      <div className="ac-head"><div><h1>Ordrer</h1><p>Alle bestillinger for {D.company.name}</p></div>
        <div className="ac-head__actions"><Button variant="secondary" iconStart={<Icon name="download" size={16} />}>Eksporter</Button></div>
      </div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'alle', label: 'Alle', count: D.orders.length },
          { value: 'apen', label: 'Åpne', count: D.orders.filter(groups.apen).length },
          { value: 'levert', label: 'Levert', count: D.orders.filter(groups.levert).length },
          { value: 'forfalt', label: 'Forfalt', count: D.orders.filter(groups.forfalt).length },
        ]} />
      </div>
      <div className="ac-card">
        <table className="ac-table">
          <thead><tr><th>Ordre</th><th>Dato</th><th>Referanse</th><th>Status</th><th className="num">Varelinjer</th><th className="num">Beløp eks. mva</th></tr></thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id} className="is-click" onClick={() => openOrder(o.id)}>
                <td className="mono">#{o.id}</td>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>{o.date}</td>
                <td>{o.ref || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="num">{o.lines}</td>
                <td className="num">{window.money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="ac-empty">Ingen ordrer i denne kategorien.</div>}
      </div>
    </div>
  );
}
window.Orders = Orders;

function OrderDetail({ id, go }) {
  const { OrderStatusBadge, Button, DemoDataBadge } = NS();
  const D = window.DEMO;
  const o = D.orders.find(x => x.id === id) || D.orders[0];
  const lines = D.products.slice(0, o.lines).map((p, i) => ({ ...p, qty: [12, 4, 24, 6, 48][i] || 6 }));
  const sub = lines.reduce((s, l) => s + l.amount * l.qty, 0);
  const vat = Math.round(sub * 0.25);
  const steps = [
    { t: 'Bestilt', d: o.date, state: 'done' },
    { t: 'Bekreftet', d: o.date, state: 'done' },
    { t: 'Plukket & pakket', d: '05.06.2026', state: o.status === 'pending' ? 'pending' : 'done' },
    { t: 'Sendt', d: o.status === 'shipped' || o.status === 'delivered' ? '05.06.2026' : '—', state: ['shipped', 'delivered'].includes(o.status) ? 'done' : 'pending' },
    { t: 'Levert', d: o.status === 'delivered' ? '06.06.2026' : '—', state: o.status === 'delivered' ? 'done' : 'pending' },
  ];
  return (
    <div>
      <button className="ac-back" onClick={() => go('orders')}><Icon name="arrow-left" size={15} />Tilbake til ordrer</button>
      <div className="ac-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><h1>Ordre #{o.id}</h1><OrderStatusBadge status={o.status} /></div>
          <p>{o.date}{o.ref ? ` · ${o.ref}` : ''}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button variant="secondary" iconStart={<Icon name="file-down" size={16} />}>Last ned faktura</Button>
          <Button iconStart={<Icon name="rotate-cw" size={16} />}>Bestill på nytt</Button>
        </div>
      </div>

      <div className="ac-detail">
        <div className="ac-card">
          <table className="ac-table">
            <thead><tr><th>Produkt</th><th>SKU</th><th className="num">Antall</th><th className="num">Pris</th><th className="num">Sum</th></tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>{l.title}</td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{l.sku}</td>
                  <td className="num">{l.qty}</td>
                  <td className="num">{window.money(l.amount, 2)}</td>
                  <td className="num">{window.money(l.amount * l.qty, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="ac-card" style={{ padding: 'var(--space-5)' }}>
            <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Sum eks. mva</span><span>{window.money(sub, 2)}</span></div>
            <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>Frakt</span><span>{window.money(0, 2)}</span></div>
            <div className="ac-sum"><span style={{ color: 'var(--text-muted)' }}>MVA 25%</span><span>{window.money(vat, 2)}</span></div>
            <div className="ac-sum ac-sum--total"><span>Totalt</span><span>{window.money(sub + vat, 2)}</span></div>
          </div>
          <div className="ac-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ font: 'var(--weight-semibold) var(--scale-base)/1 var(--font-display)', marginBottom: 'var(--space-4)' }}>Sporing</h3>
            <div className="ac-timeline">
              {steps.map((s, i) => (
                <div key={i} className={`ac-tl ${s.state === 'done' ? 'ac-tl__done' : 'ac-tl__pending'}`}>
                  <div className="ac-tl__dot"><i></i><span></span></div>
                  <div className="ac-tl__body"><div className="ac-tl__t">{s.t}</div><div className="ac-tl__d">{s.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.OrderDetail = OrderDetail;

function PriceList() {
  const { Badge, Button } = NS();
  const D = window.DEMO;
  return (
    <div>
      <div className="ac-head"><div><h1>Din prisliste</h1><p>{D.company.priceList} · gjelder {D.company.name}</p></div>
        <div className="ac-head__actions"><Button variant="secondary" iconStart={<Icon name="download" size={16} />}>Last ned (CSV)</Button></div>
      </div>
      <p className="ac-pricelist__intro">Avtalte priser løses opp på serversiden fra din B2B-kontekst. Listepris vises kun til sammenligning. Alle priser eks. mva.</p>
      <div className="ac-card">
        <table className="ac-table">
          <thead><tr><th>Produkt</th><th>SKU</th><th className="num">Listepris</th><th className="num">Din pris</th><th className="num">Rabatt</th><th>Status</th></tr></thead>
          <tbody>
            {D.products.map(p => {
              const pct = Math.round((1 - p.amount / p.listAmount) * 100);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>{p.title}</td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{p.sku}</td>
                  <td className="num" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{window.money(p.listAmount, 2)}</td>
                  <td className="num" style={{ fontWeight: 'var(--weight-semibold)' }}>{window.money(p.amount, 2)}</td>
                  <td className="num"><Badge tone="success">−{pct}%</Badge></td>
                  <td><Badge tone={p.stock === 'out' ? 'danger' : p.stock === 'low' ? 'warning' : 'neutral'} dot>{p.stock === 'out' ? 'Utsolgt' : p.stock === 'low' ? 'Få igjen' : 'På lager'}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.PriceList = PriceList;

function Credit() {
  const { Button, Badge } = NS();
  const D = window.DEMO; const c = D.company.credit;
  const free = c.limit - c.used;
  return (
    <div>
      <div className="ac-head"><div><h1>Kreditt &amp; faktura</h1><p>Kredittgrense og utestående for {D.company.name}</p></div></div>
      <div className="ac-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="ac-kpi"><span className="ac-kpi__k">Kredittgrense</span><span className="ac-kpi__v">{window.money(c.limit)}</span></div>
        <div className="ac-kpi"><span className="ac-kpi__k">Brukt</span><span className="ac-kpi__v">{window.money(c.used)}</span><div className="ac-credit__track"><div className="ac-credit__fill" style={{ width: (c.used / c.limit * 100) + '%' }} /></div></div>
        <div className="ac-kpi"><span className="ac-kpi__k">Ledig</span><span className="ac-kpi__v" style={{ color: 'var(--status-success)' }}>{window.money(free)}</span></div>
      </div>
      <div className="ac-card">
        <div className="ac-card__head"><h3>Fakturaer</h3></div>
        <table className="ac-table">
          <thead><tr><th>Faktura</th><th>Ordre</th><th>Forfall</th><th>Status</th><th className="num">Beløp</th></tr></thead>
          <tbody>
            {D.orders.filter(o => ['invoiced', 'overdue', 'delivered'].includes(o.status)).map(o => (
              <tr key={o.id}>
                <td className="mono">F-{o.id}</td>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>#{o.id}</td>
                <td className="mono">{o.status === 'overdue' ? '24.05.2026' : '14.06.2026'}</td>
                <td>{o.status === 'overdue' ? <Badge tone="danger" dot>Forfalt</Badge> : o.status === 'invoiced' ? <Badge tone="warning" dot>Ubetalt</Badge> : <Badge tone="success" dot>Betalt</Badge>}</td>
                <td className="num">{window.money(o.total, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.Credit = Credit;

function Quotes({ go, openQuote }) {
  const { OrderStatusBadge, Button } = NS();
  const D = window.DEMO;
  return (
    <div>
      <div className="ac-head"><div><h1>Tilbud</h1><p>Forespørsler og aktive tilbud</p></div>
        <div className="ac-head__actions"><Button iconStart={<Icon name="plus" size={16} />}>Be om tilbud</Button></div>
      </div>
      <div className="ac-card">
        <table className="ac-table">
          <thead><tr><th>Tilbud</th><th>Dato</th><th>Status</th><th>Gyldig til</th><th className="num">Varelinjer</th><th className="num">Beløp</th></tr></thead>
          <tbody>
            {D.quotes.map(q => (
              <tr key={q.id} className="is-click" onClick={() => openQuote(q.id)}>
                <td className="mono">#{q.id}</td>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>{q.date}</td>
                <td><OrderStatusBadge status={q.status} /></td>
                <td className="mono">{q.valid}</td>
                <td className="num">{q.lines}</td>
                <td className="num">{window.money(q.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.Quotes = Quotes;
