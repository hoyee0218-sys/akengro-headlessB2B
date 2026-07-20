/* Storefront kit — shared parts (Icon, Header, Footer). Reads DS primitives from
   the namespace at render time (populated by bundle or preview shim). */

const NS = () => window.HeadlessB2BStorefrontDesignSystem_4ebfb1 || {};

/* Lucide icon wrapper */
function Icon({ name, size = 18, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide.createIcons({ attrs: { width: size, height: size, 'stroke-width': 1.75 } });
    }
  }, [name, size]);
  return <span ref={ref} style={{ display: 'inline-flex', ...style }} aria-hidden="true" />;
}
window.Icon = Icon;

function Logo({ onClick }) {
  return (
    <span className="sf-logo" onClick={onClick}>
      <span className="sf-logo__mark">N</span>
      <span className="sf-logo__name">Nordvik<span>·industri</span></span>
    </span>
  );
}

function Header({ route, go, loggedIn, setLoggedIn, cartCount }) {
  const { Input, IconButton, Button } = NS();
  const nav = ['Ventiler', 'Pakninger', 'Klemmer', 'Rørdeler', 'Flenser'];
  return (
    <React.Fragment>
      <div className="sf-top">
        <div className="sf-top__in">
          <span>Engros for proff · Levering i hele Norge</span>
          <span className="sf-top__links">
            <a onClick={() => go('plp')}>Hurtigbestilling</a>
            <a>Kundeservice</a>
            <a>nb-NO · NOK</a>
          </span>
        </div>
      </div>
      <header className="sf-head">
        <div className="sf-head__in">
          <Logo onClick={() => go('home')} />
          <div className="sf-search">
            <Input prefix={<Icon name="search" size={16} />} placeholder="Søk SKU, produkt eller kategori" />
          </div>
          <div className="sf-head__actions">
            {loggedIn ? (
              <Button variant="ghost" size="sm" iconStart={<Icon name="user" size={16} />} onClick={() => go('account')}>Mine sider</Button>
            ) : (
              <Button variant="ghost" size="sm" iconStart={<Icon name="user" size={16} />} onClick={() => setLoggedIn(true)}>Logg inn</Button>
            )}
            <IconButton label="Handlekurv" badge={cartCount || undefined} onClick={() => go('checkout')}><Icon name="shopping-cart" size={18} /></IconButton>
          </div>
        </div>
      </header>
      <div className="sf-nav">
        <div className="sf-nav__in">
          {nav.map((n) => (
            <button key={n} className="sf-nav__item" aria-current={route === 'plp' && n === 'Ventiler'} onClick={() => go('plp')}>{n}</button>
          ))}
          <button className="sf-nav__item" onClick={() => go('plp')} style={{ marginLeft: 'auto', color: 'var(--brand-accent)' }}>Tilbud</button>
        </div>
      </div>
    </React.Fragment>
  );
}
window.Header = Header;

function Footer() {
  return (
    <React.Fragment>
      <footer className="sf-foot">
        <div className="sf-foot__in">
          <div>
            <Logo />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--scale-sm)', marginTop: 12, maxWidth: '34ch' }}>
              Demonstrasjonsbutikk bygget på den headless B2B-malen. Innhold er fiktivt.
            </p>
          </div>
          <div><h5>Katalog</h5><ul><li><a>Ventiler</a></li><li><a>Pakninger</a></li><li><a>Rørdeler</a></li></ul></div>
          <div><h5>Konto</h5><ul><li><a>Mine sider</a></li><li><a>Ordrehistorikk</a></li><li><a>Tilbud</a></li></ul></div>
          <div><h5>Hjelp</h5><ul><li><a>Kundeservice</a></li><li><a>Frakt &amp; retur</a></li><li><a>Kontakt</a></li></ul></div>
        </div>
        <div className="sf-foot__legal">
          <span>© 2026 Nordvik Industri AS — demo</span>
          <span>Org. 912 345 678 · Vilkår · Personvern</span>
        </div>
      </footer>
    </React.Fragment>
  );
}
window.Footer = Footer;
