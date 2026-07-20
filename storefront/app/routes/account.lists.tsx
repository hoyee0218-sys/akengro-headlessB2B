/* Mine lister — saved lists + recurring orders (ui_kits/account SavedLists,
   features 2 + 7). Via AccountDataProvider.getSavedLists. */
import {useState} from 'react';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account.lists';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Badge} from '~/components/ds/Badge';
import {Icon} from '~/components/ds/Icon';

export const meta: Route.MetaFunction = () => [{title: t('account.lists.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const lists = await softAccountCall(
    () => getSeams(env).account.getSavedLists(ctx),
    [],
  );
  return {lists};
}

export default function SavedLists() {
  const {lists} = useLoaderData<typeof loader>();
  const [open, setOpen] = useState<string | null>(lists[0]?.id ?? null);

  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.lists.title')}</h1>
          <p>{t('account.lists.subtitle')}</p>
        </div>
        <div className="ac-head__actions">
          <Button iconStart={<Icon name="plus" size={16} />}>{t('account.lists.new')}</Button>
        </div>
      </div>
      <div className="ac-lists">
        {!lists.length && <div className="ac-empty">{t('account.empty.lists')}</div>}
        {lists.map((l) => {
          const isOpen = open === l.id;
          return (
            <div className="ac-list" key={l.id}>
              <div className="ac-list__head" onClick={() => setOpen(isOpen ? null : l.id)}>
                <Icon
                  name="chevron-right"
                  size={18}
                  style={{color: 'var(--text-muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s'}}
                />
                <div>
                  <div className="ac-list__title">{l.name}</div>
                  <div className="ac-list__meta">
                    {l.items.length} varer · {money(l.total)} · eier {l.owner}
                  </div>
                </div>
                <div className="ac-list__spacer" />
                {l.schedule && (
                  <Badge tone="info" dot>
                    {l.schedule}
                    {l.nextRun ? ` · neste ${l.nextRun}` : ''}
                  </Badge>
                )}
                <Button
                  as="a"
                  href="/checkout"
                  size="sm"
                  variant="secondary"
                  iconStart={<Icon name="rotate-cw" size={14} />}
                  onClick={(e: any) => e.stopPropagation()}
                >
                  {t('product.addToCart')}
                </Button>
              </div>
              {isOpen && (
                <div className="ac-list__lines">
                  <table className="ac-table">
                    <thead>
                      <tr>
                        <th>{t('account.lists.product')}</th>
                        <th>{t('account.lists.sku')}</th>
                        <th className="num">{t('qty.count')}</th>
                        <th className="num">{t('plp.price')}</th>
                        <th className="num">{t('account.dash.colTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.lines.map((ln) => (
                        <tr key={ln.sku}>
                          <td style={{fontWeight: 'var(--weight-medium)'}}>{ln.product.title}</td>
                          <td className="mono" style={{color: 'var(--text-muted)'}}>{ln.sku}</td>
                          <td className="num">{ln.qty}</td>
                          <td className="num">{money(ln.product.amount, 2)}</td>
                          <td className="num">{money(ln.product.amount * ln.qty, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {l.schedule && (
                    <div style={{padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 'var(--scale-sm)'}}>
                      <Icon name="calendar-clock" size={15} /> Planlagt levering {l.schedule.toLowerCase()} · neste {l.nextRun}
                      <Button size="sm" variant="ghost" style={{marginLeft: 'auto'}}>{t('account.lists.changePlan')}</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
