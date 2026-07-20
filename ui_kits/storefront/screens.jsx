/* Storefront kit — screens (Home, PLP, PDP). */

function money(n) { try { return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0 }).format(n); } catch (e) { return n + ' kr'; } }
const CAT_ICON = { Ventiler: 'gauge', Pakninger: 'circle-dot', Klemmer: 'grip', Rørdeler: 'spline', Flenser: 'disc' };

function Home({ go, openProduct, loggedIn }) {
  const { Button, ProductCard, DemoDataBadge } = NS();
  const D = window.DEMO;
  return (
    <main className="sf">
      <section className="sf-hero">
        <div className="sf-hero__in">
          <div>
            <div className="sf-hero__eyebrow">Engros · VVS &amp; industri</div>
            <h1>Deler på lager.<br />Priser for din bedrift.</h1>
            <p>Bestill ventiler, koblinger og rørdeler til avtalte priser. Logg inn for å se din prisliste, lagerstatus i sanntid og bestille på nytt fra tidligere ordre.</p>
            <div className="sf-hero__cta">
              <Button size="lg" onClick={() => go('plp')}>Se katalogen</Button>
              <Button size="lg" variant="secondary" onClick={() => go(loggedIn ? 'account' : 'home')} iconEnd={<Icon name="arrow-right" size={16} />}>{loggedIn ? 'Mine sider' : 'Be om konto'}</Button>
            </div>
          </div>
          <div className="sf-hero__panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Din konto</h3><DemoDataBadge />
            </div>
            {loggedIn ? (
              <React.Fragment>
                <div className="sf-stat"><span className="sf-stat__k">Prisliste</span><span className="sf-stat__v">Engros A</span></div>
                <div className="sf-stat"><span className="sf-stat__k">Betalingsvilkår</span><span className="sf-stat__v">Netto 30</span></div>
                <div className="sf-stat"><span className="sf-stat__k">Åpne ordrer</span><span className="sf-stat__v">4</span></div>
                <div className="sf-stat"><span className="sf-stat__k">Kreditt tilgjengelig</span><span className="sf-stat__v">{money(153460)}</span></div>
                <Button block style={{ marginTop: 16 }} onClick={() => go('account')}>Gå til Mine sider</Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--scale-sm)', marginBottom: 16 }}>Logg inn for å se priser, lager og ordrehistorikk for din bedrift.</p>
                <Button block onClick={() => go('home')}>Logg inn</Button>
              </React.Fragment>
            )}
          </div>
        </div>
      </section>

      <div className="sf__wrap">
        <section className="sf-sec">
          <div className="sf-sec__head"><h2>Kategorier</h2><a style={{ cursor: 'pointer', fontSize: 'var(--scale-sm)' }} onClick={() => go('plp')}>Se alle</a></div>
          <div className="sf-cats">
            {D.categories.map((c) => (
              <div key={c} className="sf-cat" onClick={() => go('plp')}>
                <Icon name={CAT_ICON[c] || 'package'} size={32} style={{ color: 'var(--text-secondary)' }} />
                <div><div className="sf-cat__name">{c}</div><div className="sf-cat__n">{D.products.filter(p => p.cat === c).length} varer</div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="sf-sec" style={{ paddingTop: 0 }}>
          <div className="sf-sec__head"><h2>Mest bestilt</h2><a style={{ cursor: 'pointer', fontSize: 'var(--scale-sm)' }} onClick={() => go('plp')}>Hele katalogen</a></div>
          <div className="sf-grid">
            {D.products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} title={p.title} sku={p.sku} amount={p.amount} listAmount={p.listAmount}
                gated={!loggedIn} stockStatus={p.stock} leadTime={p.lead} onAddToCart={() => openProduct(p.id)} href="#" />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
window.Home = Home;

function PLP({ go, openProduct, loggedIn }) {
  const { ProductCard, Select, Checkbox, Tag, Button } = NS();
  const D = window.DEMO;
  const [cats, setCats] = React.useState({});
  const [stockOnly, setStockOnly] = React.useState(false);
  const active = Object.keys(cats).filter(k => cats[k]);
  let list = D.products;
  if (active.length) list = list.filter(p => active.includes(p.cat));
  if (stockOnly) list = list.filter(p => p.stock === 'in' || p.stock === 'low');

  return (
    <main className="sf">
      <div className="sf__wrap">
        <div className="sf-crumb"><a onClick={() => go('home')}>Hjem</a> <Icon name="chevron-right" size={13} /> <span>Katalog</span></div>
        <div className="sf-plp">
          <aside className="sf-filters">
            <div className="sf-filters__grp">
              <h4>Kategori</h4>
              <div className="sf-filters__list">
                {D.categories.map(c => (
                  <Checkbox key={c} label={`${c} (${D.products.filter(p => p.cat === c).length})`} checked={!!cats[c]} onChange={() => setCats(s => ({ ...s, [c]: !s[c] }))} />
                ))}
              </div>
            </div>
            <div className="sf-filters__grp">
              <h4>Tilgjengelighet</h4>
              <div className="sf-filters__list">
                <Checkbox label="Kun på lager" checked={stockOnly} onChange={() => setStockOnly(v => !v)} />
                <Checkbox label="Inkluder restordre" />
              </div>
            </div>
            <div className="sf-filters__grp">
              <h4>Materiale</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Tag onClick={() => {}}>Rustfritt</Tag><Tag onClick={() => {}}>Messing</Tag><Tag onClick={() => {}}>Støpejern</Tag>
              </div>
            </div>
          </aside>
          <div className="sf-plp__main">
            <div className="sf-plp__bar">
              <div>
                <h2 style={{ font: 'var(--weight-bold) var(--scale-xl)/1 var(--font-display)', letterSpacing: 'var(--tracking-tight)' }}>Katalog</h2>
                <div className="sf-plp__count">{list.length} produkter{active.length ? ` · ${active.join(', ')}` : ''}</div>
              </div>
              <div style={{ width: 200 }}><Select placeholder="Sorter etter" options={['Relevans', 'Pris lav–høy', 'Pris høy–lav', 'Navn A–Å']} /></div>
            </div>
            <div className="sf-plp__grid">
              {list.map(p => (
                <ProductCard key={p.id} title={p.title} sku={p.sku} amount={p.amount} listAmount={p.listAmount}
                  gated={!loggedIn} stockStatus={p.stock} leadTime={p.lead} onAddToCart={() => openProduct(p.id)} href="#" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
window.PLP = PLP;

function PDP({ id, go, loggedIn, addToCart }) {
  const { Button, PriceDisplay, StockIndicator, QuantityStepper, QtyBreakTable, DemoDataBadge, Badge } = NS();
  const D = window.DEMO;
  const p = D.products.find(x => x.id === id) || D.products[0];
  const [qty, setQty] = React.useState(p.breaks[1] ? p.breaks[1].minQty : 1);

  return (
    <main className="sf">
      <div className="sf__wrap">
        <div className="sf-crumb"><a onClick={() => go('home')}>Hjem</a> <Icon name="chevron-right" size={13} /> <a onClick={() => go('plp')}>{p.cat}</a> <Icon name="chevron-right" size={13} /> <span>{p.sku}</span></div>
        <div className="sf-pdp">
          <div>
            <div className="sf-pdp__media">
              <DemoDataBadge corner />
              <Icon name="image" size={84} style={{ color: 'var(--gray-300)' }} />
            </div>
            <div className="sf-pdp__thumbs">
              {[0, 1, 2].map(i => <div key={i} className="sf-pdp__thumb" aria-current={i === 0}><Icon name="image" size={22} style={{ color: 'var(--gray-300)' }} /></div>)}
            </div>
          </div>
          <div className="sf-pdp__info">
            <Badge tone="outline">{p.cat}</Badge>
            <h1 style={{ marginTop: 10 }}>{p.title}</h1>
            <div className="sf-pdp__sku">SKU {p.sku}</div>
            <StockIndicator status={p.stock} leadTime={p.lead} />

            <div className="sf-pdp__priceblock">
              {loggedIn
                ? <PriceDisplay amount={p.amount} listAmount={p.listAmount} vatMode="ex" size="lg" />
                : <PriceDisplay gated />}
            </div>

            <div className="sf-pdp__buy">
              <QuantityStepper value={qty} min={1} step={p.breaks[1] ? p.breaks[1].minQty / p.breaks[1].minQty : 1} unit="stk" onChange={setQty} />
              <Button size="lg" disabled={!loggedIn || p.stock === 'out'} onClick={() => addToCart(qty)} iconStart={<Icon name="shopping-cart" size={16} />}>
                {p.stock === 'out' ? 'Utsolgt' : 'Legg i handlekurv'}
              </Button>
              <Button size="lg" variant="secondary" disabled={!loggedIn}>Be om tilbud</Button>
            </div>
            {!loggedIn && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--scale-sm)' }}>Logg inn med bedriftskontoen for pris og bestilling.</p>}

            <dl className="sf-pdp__meta">
              <dt>Materiale</dt><dd>{p.material}</dd>
              <dt>Lagerstatus</dt><dd>{p.lead}</dd>
              <dt>Prisliste</dt><dd>{loggedIn ? 'Engros A' : '—'}</dd>
              <dt>MVA</dt><dd>eks. mva</dd>
            </dl>

            {loggedIn && (
              <div className="sf-pdp__breaks">
                <h4>Mengderabatt</h4>
                <QtyBreakTable currentQty={qty} breaks={p.breaks} unit="stk" />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
window.PDP = PDP;

function Checkout({ go, loggedIn }) {
  const { Button, Input, Select, QuantityStepper, DemoDataBadge, Badge } = NS();
  const D = window.DEMO;
  const [cart, setCart] = React.useState([
    { ...D.products[0], qty: 12 },
    { ...D.products[3], qty: 100 },
    { ...D.products[2], qty: 50 },
  ]);
  const [pay, setPay] = React.useState('invoice');
  const [ship, setShip] = React.useState((D.shipTo.find(a => a.def) || D.shipTo[0]).id);
  const [placed, setPlaced] = React.useState(false);
  const setQty = (id, q) => setCart(c => c.map(l => l.id === id ? { ...l, qty: q } : l));
  const sub = cart.reduce((s, l) => s + l.amount * l.qty, 0);
  const vat = Math.round(sub * 0.25);
  const freight = sub > 5000 ? 0 : 290;

  if (placed) {
    return (
      <main className="sf"><div className="sf__wrap" style={{ maxWidth: 640, padding: 'var(--space-20) var(--space-6)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'grid', placeItems: 'center', margin: '0 auto var(--space-5)' }}><Icon name="check" size={28} /></div>
        <h1 style={{ font: 'var(--weight-bold) var(--scale-2xl)/1.1 var(--font-display)', letterSpacing: 'var(--tracking-tight)', marginBottom: 12 }}>Takk – ordren er mottatt</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Ordre #NO-104890 er opprettet. Faktura sendes til din registrerte e-post.</p>
        <div className="sf-co__seam" style={{ display: 'inline-block', marginBottom: 24 }}>DEMO – i produksjon oppretter dette en ekte ordre via Shopify Admin/Orders API og synker til SparkLayer (order-create seam §7).</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => { window.location.href = '../account/index.html'; }} iconStart={<Icon name="package" size={16} />}>Se ordren på Mine sider</Button>
          <Button variant="secondary" onClick={() => go('home')}>Fortsett å handle</Button>
        </div>
      </div><Footer /></main>
    );
  }

  return (
    <main className="sf">
      <div className="sf__wrap">
        <div className="sf-crumb"><a onClick={() => go('home')}>Hjem</a> <Icon name="chevron-right" size={13} /> <span>Kasse</span></div>
        <div className="sf-co">
          <div>
            <h1>Kasse</h1>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="shopping-cart" /><h3>Handlekurv ({cart.length})</h3></div>
              {cart.map(l => (
                <div className="sf-co__line" key={l.id}>
                  <div className="sf-co__line-img"><Icon name="image" size={20} /></div>
                  <div className="sf-co__line-main">
                    <div className="sf-co__line-t">{l.title}</div>
                    <div className="sf-co__line-sku">{l.sku} · {window.money(l.amount, 2)} / stk</div>
                  </div>
                  <QuantityStepper value={l.qty} size="sm" min={1} unit="stk" onChange={(q) => setQty(l.id, q)} />
                  <span className="sf-co__line-amt">{window.money(l.amount * l.qty, 2)}</span>
                </div>
              ))}
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="briefcase" /><h3>Bestillingsinfo</h3><div style={{ marginLeft: 'auto' }}><DemoDataBadge /></div></div>
              <div className="sf-co__fields">
                <Input label="PO-nummer / rekvisisjon" placeholder="f.eks. PO-2026-0345" />
                <Select label="Kostnadssted" options={D.costCenters} />
                <Input className="span2" label="Merknad til ordre" placeholder="Valgfri melding til lager" />
              </div>
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="map-pin" /><h3>Leveringsadresse</h3></div>
              <div className="sf-co__radios">
                {D.shipTo.map(a => (
                  <label key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="radio" name="ship" checked={ship === a.id} onChange={() => setShip(a.id)} style={{ marginTop: 3, accentColor: 'var(--brand-primary)' }} />
                    <span>
                      <span style={{ font: 'var(--weight-semibold) var(--scale-sm)/1.2 var(--font-body)', display: 'flex', gap: 8, alignItems: 'center' }}>{a.label}{a.def && <Badge tone="neutral">Standard</Badge>}</span>
                      <span style={{ display: 'block', font: 'var(--scale-sm)/1.4 var(--font-body)', color: 'var(--text-muted)', marginTop: 2 }}>{a.line}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="credit-card" /><h3>Betaling</h3></div>
              <div className="sf-co__pay">
                <div className="sf-co__paybox" data-sel={pay === 'invoice'} onClick={() => setPay('invoice')}>
                  <h4><Icon name="file-text" size={15} />Faktura</h4><p>Netto 30 · din avtalte kredittgrense</p>
                </div>
                <div className="sf-co__paybox" data-sel={pay === 'card'} onClick={() => setPay('card')}>
                  <h4><Icon name="credit-card" size={15} />Kort</h4><p>Betal nå med firmakort</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="sf-co__summary">
            <h3>Oppsummering</h3>
            <div className="sf-co__row"><span>Sum eks. mva</span><span>{window.money(sub, 2)}</span></div>
            <div className="sf-co__row"><span>Frakt</span><span>{freight === 0 ? 'Gratis' : window.money(freight, 2)}</span></div>
            <div className="sf-co__row"><span>MVA 25%</span><span>{window.money(vat, 2)}</span></div>
            <div className="sf-co__total"><span>Totalt</span><span>{window.money(sub + vat + freight, 2)}</span></div>
            <Button block size="lg" style={{ marginTop: 18 }} disabled={!loggedIn} onClick={() => { setPlaced(true); window.scrollTo(0, 0); }} iconEnd={<Icon name="arrow-right" size={16} />}>
              {pay === 'invoice' ? 'Bestill på faktura' : 'Betal og bestill'}
            </Button>
            <div className="sf-co__seam">DEMO – order-create er stubbet (§7). I produksjon: Shopify Admin/Orders API + SparkLayer-sync.</div>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}
window.Checkout = Checkout;
