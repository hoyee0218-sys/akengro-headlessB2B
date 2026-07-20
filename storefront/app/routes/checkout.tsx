/* Checkout (BUILD.md §8 / ui_kits/storefront Checkout). Cart review + PO no. /
   cost center / multi ship-to / invoice|card. Order-create is STUBBED: the
   action calls OrderProvider.createOrder (mock → fake id) + syncOrderToSparkLayer,
   then shows the success screen. Marked with DemoDataBadge / seam notes. */
import {useState} from 'react';
import {Form, Link, useActionData, useLoaderData} from 'react-router';
import type {Route} from './+types/checkout';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {getCart, clearCart} from '~/lib/cart';
import {resolveCartLines} from '~/lib/cart-resolve';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {merchantConfig} from '~/merchant.config';
import {B2BCartLineRow} from '~/components/B2BCartLineRow';
import {Button} from '~/components/ds/Button';
import {Input} from '~/components/ds/Input';
import {Select} from '~/components/ds/Select';
import {Badge} from '~/components/ds/Badge';
import {Icon} from '~/components/ds/Icon';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = () => [
  {title: t('checkout.metaTitle', {merchant: merchantConfig.merchantName})},
];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, storefront, customerAccount} = context;
  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);

  const cart = getCart(session);
  const products = await softAccountCall(
    () => seams.catalog.getProducts(ctx),
    [],
  );
  const lines = await resolveCartLines(cart, products, storefront as any);

  const [shipTo, costCenters] = ctx
    ? await Promise.all([
        softAccountCall(() => seams.account.getShipToAddresses(ctx), []),
        softAccountCall(() => seams.account.getCostCenters(ctx), []),
      ])
    : [[], []];

  return {lines, shipTo, costCenters, loggedIn: Boolean(ctx)};
}

export async function action({context, request}: Route.ActionArgs) {
  const {env, session, storefront, customerAccount} = context;
  const ctx = await getCustomerContext(
    env,
    await resolveAuthedUser({session, customerAccount, env}),
  );
  if (!ctx) return {error: 'Du må være innlogget.'};

  const form = await request.formData();
  const seams = getSeams(env);
  const cart = getCart(session);
  const products = await softAccountCall(
    () => seams.catalog.getProducts(ctx),
    [],
  );
  const resolved = await resolveCartLines(cart, products, storefront as any);
  const byId = new Map(resolved.map((line) => [line.id, line]));

  try {
    const order = await seams.order.createOrder(
      {
        lines: cart.map((l) => {
          const resolvedLine = byId.get(l.productId);
          return {
            productId: l.productId,
            sku: resolvedLine?.sku ?? l.sku ?? l.productId,
            qty: l.qty,
            price: resolvedLine?.amount ?? l.amount ?? 0,
          };
        }),
        poNumber: String(form.get('po') || ''),
        costCenter: String(form.get('costCenter') || ''),
        shipToId: String(form.get('shipTo') || ''),
        paymentMethod: (String(form.get('pay') || 'invoice') as 'invoice' | 'card'),
      },
      ctx,
    );
    await seams.order.syncOrderToSparkLayer(order);
    clearCart(session);
    return {orderId: order.platformOrderId};
  } catch (error) {
    if (error instanceof Error && error.name === 'NotImplemented') {
      return {error: 'Ordreoppretting er ikke koblet til ennå (SparkLayer / Admin).'};
    }
    throw error;
  }
}

export default function Checkout() {
  const {lines, shipTo, costCenters, loggedIn} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [pay, setPay] = useState<'invoice' | 'card'>('invoice');
  const [ship, setShip] = useState((shipTo.find((a) => a.def) || shipTo[0])?.id ?? '');

  if (actionData?.orderId) {
    return (
      <main>
        <div className="sf__wrap" style={{maxWidth: 640, padding: 'var(--space-20) var(--space-6)', textAlign: 'center'}}>
          <div style={{width: 56, height: 56, borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'grid', placeItems: 'center', margin: '0 auto var(--space-5)'}}>
            <Icon name="check" size={28} />
          </div>
          <h1 style={{font: 'var(--weight-bold) var(--scale-2xl)/1.1 var(--font-display)', letterSpacing: 'var(--tracking-tight)', marginBottom: 12}}>
            {t('checkout.successTitle')}
          </h1>
          <p style={{color: 'var(--text-secondary)', marginBottom: 8}}>
            {t('checkout.successBody')} #{actionData.orderId}
          </p>
          <div className="sf-co__seam" style={{display: 'inline-block', marginBottom: 24}}>
            DEMO – i produksjon oppretter dette en ekte ordre via Shopify Admin/Orders API og synker
            til SparkLayer (order-create seam §7).
          </div>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
            <Button as={Link} to="/account/orders" iconStart={<Icon name="package" size={16} />}>
              {t('account.orders.title')}
            </Button>
            <Button as={Link} to="/" variant="secondary">{t('cart.continue')}</Button>
          </div>
        </div>
      </main>
    );
  }

  const sub = lines.reduce((s, l) => s + l.amount * l.qty, 0);
  const vat = Math.round(sub * 0.25);
  const freight = sub > 5000 ? 0 : 290;

  return (
    <main>
      <div className="sf__wrap">
        <div className="sf-crumb">
          <Link to="/">{t('nav.home')}</Link> <Icon name="chevron-right" size={13} /> <span>{t('checkout.title')}</span>
        </div>
        <Form method="post" className="sf-co">
          <input type="hidden" name="pay" value={pay} />
          <input type="hidden" name="shipTo" value={ship} />
          <div>
            <h1>{t('checkout.title')}</h1>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="shopping-cart" /><h3>{t('nav.cart')} ({lines.length})</h3></div>
              {lines.length === 0 && <div className="ac-empty">{t('checkout.empty')}</div>}
              <div className="sf-co__lines">
                {lines.map((l) => (
                  <B2BCartLineRow
                    key={l.id}
                    layout="checkout"
                    line={{
                      id: l.id,
                      title: l.title,
                      sku: l.sku,
                      amount: l.amount,
                      qty: l.qty,
                      imageUrl: l.imageUrl,
                      variantTitle: l.variantTitle,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head">
                <Icon name="briefcase" /><h3>{t('checkout.orderInfo')}</h3>
                <div style={{marginLeft: 'auto'}}><DemoDataBadge /></div>
              </div>
              <div className="sf-co__fields">
                <Input name="po" label="PO-nummer / rekvisisjon" placeholder={t('checkout.poPlaceholder')} />
                <Select name="costCenter" label="Kostnadssted" options={costCenters} />
                <Input className="span2" name="note" label="Merknad til ordre" placeholder={t('checkout.notePlaceholder')} />
              </div>
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="map-pin" /><h3>{t('checkout.shippingAddress')}</h3></div>
              <div className="sf-co__radios">
                {shipTo.map((a) => (
                  <label key={a.id} style={{display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer'}}>
                    <input type="radio" name="ship-radio" checked={ship === a.id} onChange={() => setShip(a.id)} style={{marginTop: 3, accentColor: 'var(--brand-primary)'}} />
                    <span>
                      <span style={{font: 'var(--weight-semibold) var(--scale-sm)/1.2 var(--font-body)', display: 'flex', gap: 8, alignItems: 'center'}}>
                        {a.label}
                        {a.def && <Badge tone="neutral">{t('checkout.default')}</Badge>}
                      </span>
                      <span style={{display: 'block', font: 'var(--scale-sm)/1.4 var(--font-body)', color: 'var(--text-muted)', marginTop: 2}}>{a.line}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sf-co__sec">
              <div className="sf-co__sec-head"><Icon name="credit-card" /><h3>{t('checkout.pay')}</h3></div>
              <div className="sf-co__pay">
                <div className="sf-co__paybox" data-sel={pay === 'invoice'} onClick={() => setPay('invoice')}>
                  <h4><Icon name="file-text" size={15} />{t('checkout.invoice')}</h4>
                  <p>{t('checkout.invoiceTerms')}</p>
                </div>
                <div className="sf-co__paybox" data-sel={pay === 'card'} onClick={() => setPay('card')}>
                  <h4><Icon name="credit-card" size={15} />{t('checkout.card')}</h4>
                  <p>{t('checkout.cardHint')}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="sf-co__summary">
            <h3>{t('checkout.summary')}</h3>
            <div className="sf-co__row"><span>{t('cart.subtotal')} {t('price.exVat')}</span><span>{money(sub, 2)}</span></div>
            <div className="sf-co__row"><span>{t('checkout.shipping')}</span><span>{freight === 0 ? 'Gratis' : money(freight, 2)}</span></div>
            <div className="sf-co__row"><span>{t('pdp.vat')} 25%</span><span>{money(vat, 2)}</span></div>
            <div className="sf-co__total"><span>{t('account.dash.colTotal')}</span><span>{money(sub + vat + freight, 2)}</span></div>
            <Button type="submit" block size="lg" style={{marginTop: 18}} disabled={!loggedIn || lines.length === 0} iconEnd={<Icon name="arrow-right" size={16} />}>
              {t('checkout.pay')}
            </Button>
            {!loggedIn && (
              <p style={{color: 'var(--text-muted)', fontSize: 'var(--scale-sm)', marginTop: 10}}>
                <Link to="/account/login">{t('nav.login')}</Link>
              </p>
            )}
            <div className="sf-co__seam">
              DEMO – order-create er stubbet (§7). I produksjon: Shopify Admin/Orders API + SparkLayer-sync.
            </div>
          </aside>
        </Form>
      </div>
    </main>
  );
}
