/* Tilbud — quotes list (ui_kits/account Quotes). Gated by features.quotes via
   the sidebar; data via AccountDataProvider.getQuotes. */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/account.quotes._index';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {OrderStatusBadge} from '~/components/ds/OrderStatusBadge';

export const meta: Route.MetaFunction = () => [{title: t('account.quotes.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const quotes = await softAccountCall(
    () => getSeams(env).account.getQuotes(ctx),
    [],
  );
  return {quotes};
}

export default function Quotes() {
  const {quotes} = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.quotes.title')}</h1>
          <p>{t('account.quotes.subtitle')}</p>
        </div>
        <div className="ac-head__actions">
          <Button iconStart={<Icon name="plus" size={16} />}>{t('product.requestQuote')}</Button>
        </div>
      </div>
      <div className="ac-card">
        <table className="ac-table">
          <thead>
            <tr>
              <th>{t('account.quotes.title')}</th>
              <th>{t('account.dash.colDate')}</th>
              <th>{t('account.dash.colStatus')}</th>
              <th>{t('account.quotes.validUntil')}</th>
              <th className="num">{t('account.quotes.lineItems')}</th>
              <th className="num">{t('account.dash.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="is-click">
                <td className="mono"><Link to={`/account/quotes/${q.id}`} style={{color: 'inherit'}}>#{q.id}</Link></td>
                <td className="mono" style={{color: 'var(--text-muted)'}}>{q.date}</td>
                <td><OrderStatusBadge status={q.status} /></td>
                <td className="mono">{q.valid}</td>
                <td className="num">{q.lines}</td>
                <td className="num">{money(q.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!quotes.length && <div className="ac-empty">{t('account.empty.quotes')}</div>}
      </div>
    </div>
  );
}
