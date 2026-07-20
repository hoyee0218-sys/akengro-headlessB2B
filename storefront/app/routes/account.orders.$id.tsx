/* Order detail (ui_kits/account OrderDetail). Order + line items via the seams. */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {OrderStatusBadge} from '~/components/ds/OrderStatusBadge';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${t('account.dash.colOrder')} #${data?.order?.id ?? ''} — ${t('account.meta.suffix')}`},
];

const QTY_PATTERN = [12, 4, 24, 6, 48];

export async function loader({context, params}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const order = await softAccountCall(() => seams.account.getOrder(params.id, ctx), null);
  if (!order) throw new Response(t('account.notFound'), {status: 404});
  const products = await seams.catalog.getProducts(ctx);
  const lines = products.slice(0, order.lines).map((p, i) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    amount: p.amount,
    qty: QTY_PATTERN[i] || 6,
  }));
  return {order, lines};
}

export default function OrderDetail() {
  const {order: o, lines} = useLoaderData<typeof loader>();
  const sub = lines.reduce((s, l) => s + l.amount * l.qty, 0);
  const vat = Math.round(sub * 0.25);
  const steps = [
    {label: 'Bestilt', d: o.date, state: 'done'},
    {label: t('orderStatus.confirmed'), d: o.date, state: 'done'},
    {label: 'Plukket & pakket', d: '05.06.2026', state: o.status === 'pending' ? 'pending' : 'done'},
    {label: 'Sendt', d: ['shipped', 'delivered'].includes(o.status) ? '05.06.2026' : '—', state: ['shipped', 'delivered'].includes(o.status) ? 'done' : 'pending'},
    {label: t('orderStatus.delivered'), d: o.status === 'delivered' ? '06.06.2026' : '—', state: o.status === 'delivered' ? 'done' : 'pending'},
  ];

  return (
    <div>
      <Link to="/account/orders" className="ac-back">
        <Icon name="arrow-left" size={15} />Tilbake til ordrer
      </Link>
      <div className="ac-head">
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <h1>{t('account.dash.colOrder')} #{o.id}</h1>
            <OrderStatusBadge status={o.status} />
          </div>
          <p>{o.date}{o.ref ? ` · ${o.ref}` : ''}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button variant="secondary" iconStart={<Icon name="file-down" size={16} />}>{t('account.action.download')}</Button>
          <Button iconStart={<Icon name="rotate-cw" size={16} />}>{t('account.action.reorder')}</Button>
        </div>
      </div>

      <div className="ac-detail">
        <div className="ac-card">
          <table className="ac-table">
            <thead>
              <tr>
                <th>{t('account.orders.product')}</th>
                <th>{t('account.orders.sku')}</th>
                <th className="num">{t('qty.count')}</th>
                <th className="num">{t('plp.price')}</th>
                <th className="num">{t('account.dash.colTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td style={{fontWeight: 'var(--weight-medium)'}}>{l.title}</td>
                  <td className="mono" style={{color: 'var(--text-muted)'}}>{l.sku}</td>
                  <td className="num">{l.qty}</td>
                  <td className="num">{money(l.amount, 2)}</td>
                  <td className="num">{money(l.amount * l.qty, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-5)'}}>
          <div className="ac-card" style={{padding: 'var(--space-5)'}}>
            <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('cart.subtotal')} {t('price.exVat')}</span><span>{money(sub, 2)}</span></div>
            <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('account.orders.shipping')}</span><span>{money(0, 2)}</span></div>
            <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('pdp.vat')} 25%</span><span>{money(vat, 2)}</span></div>
            <div className="ac-sum ac-sum--total"><span>{t('account.dash.colTotal')}</span><span>{money(sub + vat, 2)}</span></div>
          </div>
          <div className="ac-card" style={{padding: 'var(--space-5)'}}>
            <h3 style={{font: 'var(--weight-semibold) var(--scale-base)/1 var(--font-display)', marginBottom: 'var(--space-4)'}}>{t('account.action.track')}</h3>
            <div className="ac-timeline">
              {steps.map((s, i) => (
                <div key={i} className={`ac-tl ${s.state === 'done' ? 'ac-tl__done' : 'ac-tl__pending'}`}>
                  <div className="ac-tl__dot"><i></i><span></span></div>
                  <div className="ac-tl__body"><div className="ac-tl__t">{s.label}</div><div className="ac-tl__d">{s.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
