/* Varslinger + back-in-stock watch (ui_kits/account Notifications, feature 6).
   Via AccountDataProvider.getNotifications / getStockWatch. */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account.notifications';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {StockIndicator} from '~/components/ds/StockIndicator';

export const meta: Route.MetaFunction = () => [{title: t('account.notifications.meta')}];

const ICON: Record<string, string> = {
  'back-in-stock': 'package-check',
  order: 'truck',
  approval: 'clock',
  invoice: 'triangle-alert',
  quote: 'file-text',
};

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const [notifications, watch] = await Promise.all([
    softAccountCall(() => seams.account.getNotifications(ctx), []),
    softAccountCall(() => seams.account.getStockWatch(ctx), []),
  ]);
  return {notifications, watch};
}

export default function Notifications() {
  const {notifications, watch} = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.notifications.title')}</h1>
          <p>{t('account.notifications.subtitle')}</p>
        </div>
        <div className="ac-head__actions">
          <Button variant="ghost" size="sm">{t('account.notifications.markAll')}</Button>
        </div>
      </div>
      <div className="ac-grid2">
        <div className="ac-card">
          <div className="ac-card__head"><h3>{t('account.notifications.recent')}</h3></div>
          {notifications.map((n) => (
            <div className="ac-notif" key={n.id}>
              <span className="ac-notif__ico"><Icon name={ICON[n.type] || 'bell'} size={16} /></span>
              <div className="ac-notif__body">
                <div className="ac-notif__t">
                  {n.product ? <b>{n.product.title}</b> : <b>{n.ref}</b>} {n.text}
                </div>
                <div className="ac-notif__d">{n.date}</div>
              </div>
              {!n.read && <span className="ac-notif__unread" />}
            </div>
          ))}
        </div>
        <div className="ac-card">
          <div className="ac-card__head"><h3>{t('account.notifications.watchingStock')}</h3></div>
          <div style={{padding: '4px 0'}}>
            {watch.map((w) => (
              <div key={w.sku} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)'}}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{font: 'var(--weight-medium) var(--scale-sm)/1.3 var(--font-body)'}}>{w.product.title}</div>
                  <div style={{marginTop: 4}}><StockIndicator status={w.product.stock} leadTime={w.product.lead} /></div>
                </div>
                <Button size="sm" variant="ghost" iconStart={<Icon name="bell-off" size={14} />}>{t('account.notifications.unfollow')}</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
