/* Brukere & godkjenning (ui_kits/account Users, feature 4). The approvals queue
   is shown only to roles with the approval:manage permission (BUILD.md §6). */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account.users';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {can} from '~/lib/entitlement';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Badge} from '~/components/ds/Badge';
import {Icon} from '~/components/ds/Icon';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = () => [{title: t('account.users.meta')}];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const ctx = (await getCustomerContext(env, await resolveAuthedUser({session, customerAccount, env})))!;
  const seams = getSeams(env);
  const canApprove = can(
    {companyId: ctx.companyId, priceListIds: ctx.priceListIds, permissions: ctx.permissions},
    'approval:manage',
  );
  const [users, roles, approvals] = await Promise.all([
    softAccountCall(() => seams.account.getUsers(ctx), []),
    softAccountCall(() => seams.account.getRoles(ctx), {}),
    canApprove ? softAccountCall(() => seams.account.getApprovals(ctx), []) : Promise.resolve([]),
  ]);
  return {users, roles, approvals, canApprove};
}

export default function Users() {
  const {users, roles, approvals, canApprove} = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="ac-head">
        <div>
          <h1>{t('account.users.title')}</h1>
          <p>{t('account.users.subtitle')}</p>
        </div>
        <div className="ac-head__actions">
          <DemoDataBadge />
          <Button iconStart={<Icon name="user-plus" size={16} />}>{t('account.users.invite')}</Button>
        </div>
      </div>

      {canApprove && approvals.length > 0 && (
        <div className="ac-card" style={{marginBottom: 'var(--space-6)'}}>
          <div className="ac-card__head"><h3>Venter på godkjenning ({approvals.length})</h3></div>
          {approvals.map((a) => (
            <div className="ac-approval" key={a.id}>
              <Icon name="clock" size={18} style={{color: 'var(--status-warning)'}} />
              <div className="ac-approval__main">
                <div className="ac-approval__t">{a.id} · {a.by}</div>
                <div className="ac-approval__sub">
                  {a.date} · {a.lines} varelinjer{a.ref ? ` · ${a.ref}` : ''}{a.note ? ` · «${a.note}»` : ''}
                </div>
              </div>
              <span className="ac-approval__amt">{money(a.total)}</span>
              <div style={{display: 'flex', gap: 8}}>
                <Button size="sm" variant="secondary">{t('account.users.reject')}</Button>
                <Button size="sm" iconStart={<Icon name="check" size={14} />}>{t('account.users.approve')}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ac-card">
        <div className="ac-card__head"><h3>{t('account.users.members')}</h3></div>
        <table className="ac-table">
          <thead>
            <tr>
              <th>{t('account.users.title')}</th>
              <th>{t('account.users.role')}</th>
              <th className="num">{t('account.users.orderLimit')}</th>
              <th>{t('account.dash.colStatus')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="ac-user">
                    <span className="ac-avatar">{u.initials}</span>
                    <div>
                      <div className="ac-user__name">{u.name}</div>
                      <div className="ac-user__email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>{u.role}</td>
                <td className="num">{u.limit == null ? <span style={{color: 'var(--text-muted)'}}>{t('account.users.unlimited')}</span> : money(u.limit)}</td>
                <td>{u.status === 'active' ? <Badge tone="success" dot>{t('account.users.active')}</Badge> : <Badge tone="warning" dot>{t('account.users.invited')}</Badge>}</td>
                <td className="num"><Button size="sm" variant="ghost">{t('account.users.edit')}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ac-roles">
        {Object.keys(roles).map((r) => (
          <div className="ac-role" key={r}>
            <h4>{r}</h4>
            <p>{roles[r]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
