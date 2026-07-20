/* Prisliste (ui_kits/account PriceList). Entitlement-resolved prices vs list
   price; resolution is server-side from the B2B context (BUILD.md §0.5). */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account.pricelist';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, softAccountCall} from '~/lib/seams';
import {getPricedProducts} from '~/lib/catalog';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Badge} from '~/components/ds/Badge';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';

export const meta: Route.MetaFunction = () => [{title: t('account.priceList.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const products = await softAccountCall(() => getPricedProducts(env, ctx), []);
  return {products, priceList: ctx.priceListLabel, companyName: ctx.companyName};
}

export default function PriceList() {
  const {products, priceList, companyName} = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.priceList.title')}</h1>
          <p>{priceList} · gjelder {companyName}</p>
        </div>
        <div className="ac-head__actions">
          <Button variant="secondary" iconStart={<Icon name="download" size={16} />}>{t('account.action.download')} (CSV)</Button>
        </div>
      </div>
      <p className="ac-pricelist__intro">
        Avtalte priser løses opp på serversiden fra din B2B-kontekst. Listepris vises kun til
        sammenligning. Alle priser {t('price.exVat')}.
      </p>
      <div className="ac-card">
        <table className="ac-table">
          <thead>
            <tr>
              <th>{t('account.priceList.product')}</th>
              <th>{t('account.priceList.sku')}</th>
              <th className="num">{t('account.priceList.listPrice')}</th>
              <th className="num">{t('account.priceList.yourPrice')}</th>
              <th className="num">{t('account.priceList.discount')}</th>
              <th>{t('account.dash.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const net = p.price.amount ?? p.amount;
              const listAmt = p.price.listAmount ?? p.listAmount;
              const pct = Math.round((1 - net / listAmt) * 100);
              return (
                <tr key={p.id}>
                  <td style={{fontWeight: 'var(--weight-medium)'}}>{p.title}</td>
                  <td className="mono" style={{color: 'var(--text-muted)'}}>{p.sku}</td>
                  <td className="num" style={{color: 'var(--text-muted)', textDecoration: 'line-through'}}>{money(listAmt, 2)}</td>
                  <td className="num" style={{fontWeight: 'var(--weight-semibold)'}}>{money(net, 2)}</td>
                  <td className="num"><Badge tone="success">{t('price.yourPriceSave', {pct})}</Badge></td>
                  <td>
                    <Badge tone={p.stock === 'out' ? 'danger' : p.stock === 'low' ? 'warning' : 'neutral'} dot>
                      {p.stock === 'out' ? t('stock.out') : p.stock === 'low' ? t('stock.low') : t('stock.in')}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
