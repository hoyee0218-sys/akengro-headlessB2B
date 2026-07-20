/* Kreditt & faktura (ui_kits/account Credit). Gated by features.creditDisplay.
   Credit + invoices via AccountDataProvider. */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account.credit';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Badge} from '~/components/ds/Badge';

export const meta: Route.MetaFunction = () => [{title: t('account.credit.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const [credit, orders] = await Promise.all([
    softAccountCall(() => seams.account.getCredit(ctx), {limit: 0, used: 0}),
    softAccountCall(() => seams.account.getOrderHistory(ctx), []),
  ]);
  const invoices = orders.filter((o) => ['invoiced', 'overdue', 'delivered'].includes(o.status));
  return {credit, invoices, companyName: ctx.companyName};
}

export default function Credit() {
  const {credit, invoices, companyName} = useLoaderData<typeof loader>();
  const free = credit.limit - credit.used;
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.credit.title')}</h1>
          <p>Kredittgrense og utestående for {companyName}</p>
        </div>
      </div>
      <div className="ac-kpis" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
        <div className="ac-kpi"><span className="ac-kpi__k">{t('account.credit.limit')}</span><span className="ac-kpi__v">{money(credit.limit)}</span></div>
        <div className="ac-kpi">
          <span className="ac-kpi__k">{t('account.credit.used')}</span>
          <span className="ac-kpi__v">{money(credit.used)}</span>
          <div className="ac-credit__track"><div className="ac-credit__fill" style={{width: (credit.used / credit.limit) * 100 + '%'}} /></div>
        </div>
        <div className="ac-kpi"><span className="ac-kpi__k">{t('account.credit.available')}</span><span className="ac-kpi__v" style={{color: 'var(--status-success)'}}>{money(free)}</span></div>
      </div>
      <div className="ac-card">
        <div className="ac-card__head"><h3>{t('account.credit.invoices')}</h3></div>
        <table className="ac-table">
          <thead>
            <tr>
              <th>{t('account.credit.invoice')}</th>
              <th>{t('account.dash.colOrder')}</th>
              <th>{t('account.credit.due')}</th>
              <th>{t('account.dash.colStatus')}</th>
              <th className="num">{t('account.dash.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((o) => (
              <tr key={o.id}>
                <td className="mono">F-{o.id}</td>
                <td className="mono" style={{color: 'var(--text-muted)'}}>#{o.id}</td>
                <td className="mono">{o.status === 'overdue' ? '24.05.2026' : '14.06.2026'}</td>
                <td>
                  {o.status === 'overdue' ? (
                    <Badge tone="danger" dot>{t('orderStatus.overdue')}</Badge>
                  ) : o.status === 'invoiced' ? (
                    <Badge tone="warning" dot>{t('orderStatus.invoiced')}</Badge>
                  ) : (
                    <Badge tone="success" dot>{t('orderStatus.paid')}</Badge>
                  )}
                </td>
                <td className="num">{money(o.total, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
