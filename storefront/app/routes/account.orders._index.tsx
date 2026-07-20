/* Orders list (ui_kits/account Orders). Via AccountDataProvider.getOrderHistory. */
import {useState} from 'react';
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {Tabs} from '~/components/ds/Tabs';
import {OrderStatusBadge} from '~/components/ds/OrderStatusBadge';

export const meta: Route.MetaFunction = () => [{title: t('account.orders.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const orders = await softAccountCall(
    () => getSeams(env).account.getOrderHistory(ctx),
    [],
  );
  return {orders, companyName: ctx.companyName};
}

const groups: Record<string, (o: {status: string}) => boolean> = {
  alle: () => true,
  apen: (o) => ['shipped', 'confirmed', 'processing', 'pending'].includes(o.status),
  levert: (o) => o.status === 'delivered',
  forfalt: (o) => o.status === 'overdue',
};

export default function Orders() {
  const {orders, companyName} = useLoaderData<typeof loader>();
  const [tab, setTab] = useState('alle');
  const list = orders.filter(groups[tab]);

  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.orders.title')}</h1>
          <p>Alle bestillinger for {companyName}</p>
        </div>
        <div className="ac-head__actions">
          <Button variant="secondary" iconStart={<Icon name="download" size={16} />}>{t('account.orders.export')}</Button>
        </div>
      </div>
      <div style={{marginBottom: 'var(--space-5)'}}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {value: 'alle', label: 'Alle', count: orders.length},
            {value: 'apen', label: 'Åpne', count: orders.filter(groups.apen).length},
            {value: 'levert', label: t('orderStatus.delivered'), count: orders.filter(groups.levert).length},
            {value: 'forfalt', label: t('orderStatus.overdue'), count: orders.filter(groups.forfalt).length},
          ]}
        />
      </div>
      <div className="ac-card">
        <table className="ac-table">
          <thead>
            <tr>
              <th>{t('account.dash.colOrder')}</th>
              <th>{t('account.dash.colDate')}</th>
              <th>{t('account.orders.reference')}</th>
              <th>{t('account.dash.colStatus')}</th>
              <th className="num">{t('account.orders.lineItems')}</th>
              <th className="num">{t('account.dash.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="is-click">
                <td className="mono"><Link to={`/account/orders/${o.id}`} style={{color: 'inherit'}}>#{o.id}</Link></td>
                <td className="mono" style={{color: 'var(--text-muted)'}}>{o.date}</td>
                <td>{o.ref || <span style={{color: 'var(--text-muted)'}}>—</span>}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="num">{o.lines}</td>
                <td className="num">{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <div className="ac-empty">{t('account.empty.orders')}</div>}
      </div>
    </div>
  );
}
