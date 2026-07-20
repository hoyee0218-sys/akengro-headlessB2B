/* Tilbud → ordre (ui_kits/account QuoteDetail, feature 8). "Godta og bestill"
   converts the quote through the OrderProvider.createOrder seam (stubbed §8) and
   syncs to SparkLayer — returning the created order id. */
import {Form, Link, useActionData, useLoaderData} from 'react-router';
import type {Route} from './+types/account.quotes.$id';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {can} from '~/lib/entitlement';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {OrderStatusBadge} from '~/components/ds/OrderStatusBadge';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${t('account.quotes.title')} #${data?.quote?.id ?? ''} — ${t('account.meta.suffix')}`},
];

export async function loader({context, params}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const quote = await softAccountCall(() => seams.account.getQuote(params.id, ctx), null);
  if (!quote) throw new Response(t('account.notFound'), {status: 404});
  const lines = await softAccountCall(() => seams.account.getQuoteLines(params.id, ctx), []);
  return {quote, lines, canConvert: can({companyId: ctx.companyId, priceListIds: ctx.priceListIds, permissions: ctx.permissions}, 'quote:convert')};
}

export async function action({context, params}: Route.ActionArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const lines = await softAccountCall(() => seams.account.getQuoteLines(params.id, ctx), []);
  const order = await seams.order.createOrder(
    {lines: lines.map((l) => ({productId: l.product.id, sku: l.sku, qty: l.qty, price: l.price}))},
    ctx,
  );
  await seams.order.syncOrderToSparkLayer(order);
  return {orderId: order.platformOrderId};
}

export default function QuoteDetail() {
  const {quote: q, lines, canConvert} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const converted = Boolean(actionData?.orderId);
  const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const list = lines.reduce((s, l) => s + l.product.listAmount * l.qty, 0);
  const vat = Math.round(sub * 0.25);

  return (
    <div>
      <Link to="/account/quotes" className="ac-back">
        <Icon name="arrow-left" size={15} />Tilbake til tilbud
      </Link>
      {converted && (
        <div className="ac-banner">
          <Icon name="circle-check" size={18} />
          {t('account.quotes.title')} {q.id} · {t('account.dash.colOrder')} #{actionData!.orderId}.{' '}
          <span style={{fontFamily: 'var(--font-mono)', opacity: 0.8}}>(DEMO – order-create seam §7)</span>
        </div>
      )}
      <div className="ac-head">
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <h1>{t('account.quotes.title')} #{q.id}</h1>
            <OrderStatusBadge status={converted ? 'confirmed' : q.status} />
          </div>
          <p>{q.date} · gyldig til {q.valid}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button variant="secondary" iconStart={<Icon name="file-down" size={16} />}>{t('account.action.download')}</Button>
          <Form method="post">
            <Button type="submit" disabled={converted || !canConvert} iconStart={<Icon name="check" size={16} />}>
              Godta og bestill
            </Button>
          </Form>
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
                <th className="num">{t('account.quotes.listPrice')}</th>
                <th className="num">{t('account.quotes.offerPrice')}</th>
                <th className="num">{t('account.dash.colTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.sku}>
                  <td style={{fontWeight: 'var(--weight-medium)'}}>{l.product.title}</td>
                  <td className="mono" style={{color: 'var(--text-muted)'}}>{l.sku}</td>
                  <td className="num">{l.qty}</td>
                  <td className="num" style={{color: 'var(--text-muted)', textDecoration: 'line-through'}}>{money(l.product.listAmount, 2)}</td>
                  <td className="num" style={{fontWeight: 'var(--weight-semibold)'}}>{money(l.price, 2)}</td>
                  <td className="num">{money(l.price * l.qty, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ac-card" style={{padding: 'var(--space-5)'}}>
          <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('cart.subtotal')}</span><span style={{textDecoration: 'line-through', color: 'var(--text-muted)'}}>{money(list, 2)}</span></div>
          <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('account.quotes.title')} {t('price.exVat')}</span><span>{money(sub, 2)}</span></div>
          <div className="ac-sum"><span style={{color: 'var(--status-success-fg)'}}>{t('account.quotes.youSave')}</span><span style={{color: 'var(--status-success-fg)'}}>{money(list - sub, 2)}</span></div>
          <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('pdp.vat')} 25%</span><span>{money(vat, 2)}</span></div>
          <div className="ac-sum ac-sum--total"><span>{t('account.dash.colTotal')}</span><span>{money(sub + vat, 2)}</span></div>
        </div>
      </div>
    </div>
  );
}
