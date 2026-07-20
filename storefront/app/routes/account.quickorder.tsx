/* Hurtigbestilling — quick order pad + CSV paste (ui_kits/account QuickOrder,
   feature 1). SKU resolution against the catalog seam; valid lines post to the
   B2B cart seam and stay on the page with mini-cart feedback. */
import {useMemo, useState} from 'react';
import {useFetcher, useLoaderData} from 'react-router';
import type {Route} from './+types/account.quickorder';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {addLine, cartCount, getCart} from '~/lib/cart';
import type {CartAddResult} from '~/lib/cart-add';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import type {CatalogProduct} from '~/lib/seams/types';
import {Button} from '~/components/ds/Button';
import {Input} from '~/components/ds/Input';
import {Icon} from '~/components/ds/Icon';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';
import {useCartAddFeedback} from '~/components/CartUi';

export const meta: Route.MetaFunction = () => [{title: t('account.quickOrder.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const products = await softAccountCall(
    () => getSeams(env).catalog.getProducts(ctx),
    [],
  );
  return {products};
}

export async function action({context, request}: Route.ActionArgs) {
  const {env, session, customerAccount} = context;
  const form = await request.formData();
  const payload = String(form.get('lines') || '');
  const ctx = await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env}));
  const products = await softAccountCall(
    () => getSeams(env).catalog.getProducts(ctx),
    [],
  );

  let addedCount = 0;
  payload
    .split(',')
    .filter(Boolean)
    .forEach((pair) => {
      const [id, qtyRaw] = pair.split(':');
      const qty = parseInt(qtyRaw, 10);
      if (!id || !(qty > 0)) return;
      const product = products.find((p) => p.id === id || p.sku === id);
      addLine(session, id, qty, product
        ? {
            title: product.title,
            sku: product.sku,
            amount: product.amount,
            handle: id,
          }
        : undefined);
      addedCount += 1;
    });

  if (addedCount === 0) {
    return {ok: false as const, error: 'No valid lines'};
  }
  return {
    ok: true as const,
    cartCount: cartCount(session),
    addedCount,
    lines: getCart(session),
  } satisfies CartAddResult;
}

interface Row {
  key: string;
  sku: string;
  qty: string;
}

export default function QuickOrder() {
  const {products} = useLoaderData<typeof loader>();
  const skuMap = useMemo(() => {
    const m: Record<string, CatalogProduct> = {};
    products.forEach((p) => (m[p.sku.toUpperCase()] = p));
    return m;
  }, [products]);

  const blank = (): Row => ({key: Math.random().toString(36).slice(2), sku: '', qty: ''});
  const [rows, setRows] = useState<Row[]>([
    {key: 'a', sku: 'VLV-8830-SS', qty: '12'},
    {key: 'b', sku: 'CLP-022-ZN', qty: '100'},
    blank(),
  ]);
  const [paste, setPaste] = useState('');
  const fetcher = useFetcher<CartAddResult>();
  useCartAddFeedback(fetcher);

  const resolve = (sku: string) => skuMap[(sku || '').trim().toUpperCase()] || null;
  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => {
      const next = rs.map((r) => (r.key === key ? {...r, ...patch} : r));
      const last = next[next.length - 1];
      if (last.sku || last.qty) next.push(blank());
      return next;
    });
  const removeRow = (key: string) =>
    setRows((rs) => {
      const filtered = rs.filter((r) => r.key !== key);
      return filtered.length ? filtered : [blank()];
    });

  const applyPaste = () => {
    const parsed = paste
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [sku, qty] = l.split(/[\s,;\t]+/);
        return {key: Math.random().toString(36).slice(2), sku: sku || '', qty: qty || '1'};
      });
    if (parsed.length) {
      setRows(parsed.concat(blank()));
      setPaste('');
    }
  };

  const valid = rows.filter((r) => resolve(r.sku) && parseInt(r.qty, 10) > 0);
  const total = valid.reduce((s, r) => s + resolve(r.sku)!.amount * parseInt(r.qty, 10), 0);
  const totalQty = valid.reduce((s, r) => s + parseInt(r.qty, 10), 0);
  const linesPayload = valid.map((r) => `${resolve(r.sku)!.id}:${parseInt(r.qty, 10)}`).join(',');

  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.quickOrder.title')}</h1>
          <p>{t('account.quickOrder.subtitle')}</p>
        </div>
        <div className="ac-head__actions"><DemoDataBadge /></div>
      </div>
      <div className="ac-qo">
        <div className="ac-card">
          <div className="ac-qo__rows">
            <div className="ac-qo__row ac-qo__row--head">
              <span>{t('account.quickOrder.sku')}</span><span>{t('account.quickOrder.product')}</span><span>{t('qty.count')}</span><span></span>
            </div>
            {rows.map((r) => {
              const p = resolve(r.sku);
              return (
                <div className="ac-qo__row" key={r.key}>
                  <Input size="sm" mono placeholder={t('account.quickOrder.sku')} value={r.sku} onChange={(e: any) => setRow(r.key, {sku: e.target.value})} />
                  <div>
                    {p ? (
                      <div className="ac-qo__match">
                        {p.title}
                        <div className="sku">{money(p.amount, 2)} · {p.cat}</div>
                      </div>
                    ) : r.sku ? (
                      <span className="ac-qo__unmatched">{t('account.quickOrder.unknownSku')}</span>
                    ) : (
                      <span className="ac-qo__unmatched" style={{opacity: 0.5}}>—</span>
                    )}
                  </div>
                  <Input size="sm" mono type="number" placeholder="0" value={r.qty} onChange={(e: any) => setRow(r.key, {qty: e.target.value})} />
                  <button className="ac-qo__rm" aria-label={t('cart.remove')} onClick={() => removeRow(r.key)}>
                    <Icon name="x" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-5)'}}>
          <div className="ac-card" style={{padding: 'var(--space-5)'}}>
            <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('account.quickOrder.validLines')}</span><span>{valid.length}</span></div>
            <div className="ac-sum"><span style={{color: 'var(--text-muted)'}}>{t('qty.count')}</span><span>{t('cart.lineQty', {qty: totalQty})}</span></div>
            <div className="ac-sum ac-sum--total"><span>{t('cart.subtotal')} {t('price.exVat')}</span><span>{money(total, 2)}</span></div>
            <fetcher.Form method="post">
              <input type="hidden" name="lines" value={linesPayload} />
              <Button type="submit" block style={{marginTop: 16}} disabled={!valid.length} iconStart={<Icon name="shopping-cart" size={16} />}>
                {t('product.addToCart')} ({valid.length})
              </Button>
            </fetcher.Form>
          </div>
          <div className="ac-card" style={{padding: 'var(--space-5)'}}>
            <h3 style={{font: 'var(--weight-semibold) var(--scale-base)/1 var(--font-display)', marginBottom: 4}}>{t('account.quickOrder.paste')}</h3>
            <p style={{font: 'var(--scale-xs)/1.5 var(--font-body)', color: 'var(--text-muted)', marginBottom: 12}}>
              <span style={{fontFamily: 'var(--font-mono)'}}>{t('account.quickOrder.pasteHint')}</span>
            </p>
            <div className="ac-qo__paste">
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={'VLV-8830-SS\t12\nCLP-022-ZN\t100\nFLG-2210-CS\t50'}
              />
            </div>
            <Button variant="secondary" block style={{marginTop: 12}} disabled={!paste.trim()} onClick={applyPaste}>
              Tolk og fyll inn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
