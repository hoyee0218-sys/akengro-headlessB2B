/* Account chrome — "Mine sider" sidebar, ported from ui_kits/account/parts.jsx.
   Nav targets are real routes; the active item is derived from the URL. Counts
   come from the account layout loader (all via AccountDataProvider). Sections
   are gated by merchant.config.features + entitlement permissions (§6). */
import {Link, useLocation} from 'react-router';
import {Icon} from './ds/Icon';
import {merchantConfig} from '~/merchant.config';
import {t} from '~/lib/copy';

export interface SidebarCounts {
  lists: number;
  orders: number;
  quotes: number;
  approvals: number;
  unread: number;
}

export interface SidebarCompany {
  name: string;
  orgnr: string;
  priceList: string;
}

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  count?: number;
  feature?: 'quotes' | 'reorder' | 'creditDisplay';
}

export function AccountSidebar({
  company,
  counts,
}: {
  company: SidebarCompany;
  counts: SidebarCounts;
}) {
  const {pathname} = useLocation();
  const f = merchantConfig.features;

  const groups: {label: string; items: NavEntry[]}[] = [
    {
      label: t('account.nav.ordering'),
      items: [
        {to: '/account', label: t('account.nav.overview'), icon: 'layout-dashboard'},
        {to: '/account/quickorder', label: t('account.nav.quickOrder'), icon: 'zap'},
        {to: '/account/lists', label: t('account.nav.lists'), icon: 'list-checks', count: counts.lists},
      ],
    },
    {
      label: t('account.nav.ordersQuotes'),
      items: [
        {to: '/account/orders', label: t('account.nav.orders'), icon: 'package', count: counts.orders},
        {to: '/account/quotes', label: t('account.nav.quotes'), icon: 'file-text', count: counts.quotes, feature: 'quotes'},
      ],
    },
    {
      label: t('account.nav.company'),
      items: [
        {to: '/account/pricelist', label: t('account.nav.priceList'), icon: 'tag'},
        {to: '/account/credit', label: t('account.nav.credit'), icon: 'wallet', feature: 'creditDisplay'},
        {to: '/account/users', label: t('account.nav.users'), icon: 'users', count: counts.approvals || undefined},
        {to: '/account/notifications', label: t('account.nav.notifications'), icon: 'bell', count: counts.unread || undefined},
      ],
    },
  ];

  const isActive = (to: string) =>
    to === '/account' ? pathname === '/account' : pathname.startsWith(to);

  return (
    <aside className="ac-side">
      <Link to="/" className="ac-side__logo" style={{textDecoration: 'none', color: 'inherit'}}>
        <span className="ac-side__mark">{company.name.charAt(0)}</span>
        <span className="ac-side__name">{t('account.sidebarTitle')}</span>
      </Link>
      <div className="ac-side__co">
        <div className="ac-side__co-name">{company.name}</div>
        <div className="ac-side__co-meta">
          {t('account.orgMeta', {orgnr: company.orgnr, priceList: company.priceList})}
        </div>
      </div>
      {groups.map((g) => (
        <nav className="ac-nav" key={g.label}>
          <div className="ac-nav__label">{g.label}</div>
          {g.items
            .filter((it) => !it.feature || f[it.feature])
            .map((it) => {
              const on = isActive(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={'ac-nav__item' + (on ? ' is-active' : '')}
                  aria-current={on || undefined}
                  style={{textDecoration: 'none'}}
                >
                  <Icon name={it.icon} size={17} />
                  {it.label}
                  {it.count != null && <span className="ac-nav__count">{it.count}</span>}
                </Link>
              );
            })}
        </nav>
      ))}
      <div className="ac-side__foot ac-nav">
        <Link to="/" className="ac-nav__item" style={{textDecoration: 'none'}}>
          <Icon name="store" size={17} />
          {t('account.toStore')}
        </Link>
        <form action="/account/logout" method="post">
          <button className="ac-nav__item" type="submit" style={{width: '100%'}}>
            <Icon name="log-out" size={17} />
            {t('account.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}
