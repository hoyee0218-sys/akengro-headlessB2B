/* Account kit — shared parts (Icon, Sidebar shell). */
const NS = () => window.HeadlessB2BStorefrontDesignSystem_4ebfb1 || {};

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

function Sidebar({ section, go }) {
  const co = window.DEMO.company;
  const D = window.DEMO;
  const unread = D.notifications.filter(n => !n.read).length;
  const groups = [
    { label: 'Bestilling', items: [
      { id: 'dashboard', label: 'Oversikt', icon: 'layout-dashboard' },
      { id: 'quickorder', label: 'Hurtigbestilling', icon: 'zap' },
      { id: 'lists', label: 'Mine lister', icon: 'list-checks', count: D.savedLists.length },
    ] },
    { label: 'Ordrer & tilbud', items: [
      { id: 'orders', label: 'Ordrer', icon: 'package', count: D.orders.length },
      { id: 'quotes', label: 'Tilbud', icon: 'file-text', count: D.quotes.length },
    ] },
    { label: 'Bedrift', items: [
      { id: 'pricelist', label: 'Prisliste', icon: 'tag' },
      { id: 'credit', label: 'Kreditt', icon: 'wallet' },
      { id: 'users', label: 'Brukere', icon: 'users', count: D.approvals.length || undefined },
      { id: 'notifications', label: 'Varslinger', icon: 'bell', count: unread || undefined },
    ] },
  ];
  const isActive = (id) =>
    section === id ||
    (section === 'orderDetail' && id === 'orders') ||
    (section === 'quoteDetail' && id === 'quotes');
  return (
    <aside className="ac-side">
      <div className="ac-side__logo" onClick={() => { window.location.href = '../storefront/index.html'; }}>
        <span className="ac-side__mark">N</span>
        <span className="ac-side__name">Mine sider</span>
      </div>
      <div className="ac-side__co">
        <div className="ac-side__co-name">{co.name}</div>
        <div className="ac-side__co-meta">Org. {co.orgnr} · {co.priceList}</div>
      </div>
      {groups.map((g) => (
        <nav className="ac-nav" key={g.label}>
          <div className="ac-nav__label">{g.label}</div>
          {g.items.map((it) => {
            const on = isActive(it.id);
            return (
              <button
                key={it.id}
                className={'ac-nav__item' + (on ? ' is-active' : '')}
                style={on ? { background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' } : undefined}
                onClick={() => go(it.id)}
              >
                <Icon name={it.icon} size={17} />
                {it.label}
                {it.count != null && <span className="ac-nav__count">{it.count}</span>}
              </button>
            );
          })}
        </nav>
      ))}
      <div className="ac-side__foot ac-nav">
        <button className="ac-nav__item" onClick={() => { window.location.href = '../storefront/index.html'; }}><Icon name="store" size={17} />Til butikken</button>
        <button className="ac-nav__item"><Icon name="log-out" size={17} />Logg ut</button>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;

window.money = function (n, min) {
  try { return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: min == null ? 0 : min }).format(n); }
  catch (e) { return n + ' kr'; }
};
