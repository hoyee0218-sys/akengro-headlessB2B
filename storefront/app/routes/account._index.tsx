/* Account Dashboard (ui_kits/account Dashboard). All data via AccountDataProvider. */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/account._index';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money, catalogPath, productPath} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {OrderStatusBadge} from '~/components/ds/OrderStatusBadge';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = () => [{title: t('account.overview.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const [orders, reorder, quotes, credit] = await Promise.all([
    softAccountCall(() => seams.account.getOrderHistory(ctx), []),
    softAccountCall(() => seams.account.getReorderHistory(ctx), []),
    softAccountCall(() => seams.account.getQuotes(ctx), []),
    softAccountCall(() => seams.account.getCredit(ctx), {limit: 0, used: 0}),
  ]);
  return {ctx, orders, reorder, quotes, credit};
}

export default function Dashboard() {
  const {ctx, orders, reorder, quotes, credit} = useLoaderData<typeof loader>();
  const open = orders.filter((o) => ['shipped', 'confirmed', 'processing', 'pending'].includes(o.status)).length;
  const overdue = orders.filter((o) => o.status === 'overdue');
  const creditFree = credit.limit - credit.used;
  const firstName = 'Marius';

  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.dash.greeting', {name: firstName})}</h1>
          <p>
            {ctx.companyName} · prisliste {ctx.priceListLabel} · betalingsvilkår {ctx.terms}
          </p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button as={Link} to={catalogPath()} iconStart={<Icon name="plus" size={16} />}>
            {t('account.dash.newOrder')}
          </Button>
        </div>
      </div>

      <div className="ac-kpis">
        <div className="ac-kpi">
          <span className="ac-kpi__k"><Icon name="package" size={15} />{t('account.dash.openOrders')}</span>
          <span className="ac-kpi__v">{open}</span>
          <span className="ac-kpi__sub">2 sendes denne uken</span>
        </div>
        <div className="ac-kpi">
          <span className="ac-kpi__k"><Icon name="file-text" size={15} />{t('account.nav.quotes')}</span>
          <span className="ac-kpi__v">{quotes.length}</span>
          <span className="ac-kpi__sub">1 utløper 17.06</span>
        </div>
        <div className="ac-kpi">
          <span className="ac-kpi__k"><Icon name="triangle-alert" size={15} />{t('orderStatus.overdue')}</span>
          <span className="ac-kpi__v" style={{color: overdue.length ? 'var(--status-danger)' : 'inherit'}}>
            {money(overdue.reduce((s, o) => s + o.total, 0))}
          </span>
          <span className="ac-kpi__sub">{overdue.length} faktura</span>
        </div>
        <div className="ac-kpi">
          <span className="ac-kpi__k"><Icon name="wallet" size={15} />{t('account.dash.credit')}</span>
          <span className="ac-kpi__v">{money(creditFree)}</span>
          <div className="ac-credit__track">
            <div className="ac-credit__fill" style={{width: (credit.used / credit.limit) * 100 + '%'}} />
          </div>
        </div>
      </div>

      <div className="ac-grid2">
        <div className="ac-card">
          <div className="ac-card__head">
            <h3>{t('account.dash.recentOrders')}</h3>
            <Button as={Link} to="/account/orders" variant="ghost" size="sm" iconEnd={<Icon name="arrow-right" size={15} />}>
              {t('account.dash.allOrders')}
            </Button>
          </div>
          <table className="ac-table">
            <thead>
              <tr>
                <th>{t('account.dash.colOrder')}</th>
                <th>{t('account.dash.colDate')}</th>
                <th>{t('account.dash.colStatus')}</th>
                <th className="num">{t('account.dash.colTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 4).map((o) => (
                <tr key={o.id} className="is-click">
                  <td className="mono">
                    <Link to={`/account/orders/${o.id}`} style={{color: 'inherit'}}>#{o.id}</Link>
                  </td>
                  <td className="mono" style={{color: 'var(--text-muted)'}}>{o.date}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="num">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ac-card">
          <div className="ac-card__head">
            <h3>{t('account.dash.mostOrdered')}</h3>
            <Button as={Link} to="/account/quickorder" variant="ghost" size="sm" iconEnd={<Icon name="arrow-right" size={15} />}>
              {t('account.nav.quickOrder')}
            </Button>
          </div>
          <div style={{padding: 'var(--space-2) 0'}}>
            {reorder.slice(0, 4).map((r) => (
              <div key={r.sku} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)'}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{font: 'var(--weight-medium) var(--scale-sm)/1.3 var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    <Link to={productPath(r.product.id)} style={{color: 'inherit'}}>{r.product.title}</Link>
                  </div>
                  <div style={{font: 'var(--scale-2xs)/1 var(--font-mono)', color: 'var(--text-muted)', marginTop: 2}}>
                    {r.sku} · sist {r.lastOrdered} · {r.times}×
                  </div>
                </div>
                <Button size="sm" variant="secondary" iconStart={<Icon name="rotate-cw" size={14} />}>{t('cart.lineQty', {qty: r.lastQty})}</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
