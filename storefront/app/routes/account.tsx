/* Account layout — "Mine sider" shell (BASELINE §4.5).
   Requires verified B2B CustomerContext (tag `b2b` + sparklayer.authentication).
   Logged-out → /account/login. Shopify-logged-in but not B2B → login with reason
   (never home with ?b2b= — that was an anti-loop hack, not the baseline). */
import {Outlet, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {AccountSidebar} from '~/components/AccountChrome';

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, customerAccount} = context;
  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);

  if (!ctx) {
    throw redirect(user ? '/account/login?reason=b2b' : '/account/login');
  }

  const seams = getSeams(env);
  const [lists, orders, quotes, approvals, notifications] = await Promise.all([
    softAccountCall(() => seams.account.getSavedLists(ctx), []),
    softAccountCall(() => seams.account.getOrderHistory(ctx), []),
    softAccountCall(() => seams.account.getQuotes(ctx), []),
    softAccountCall(() => seams.account.getApprovals(ctx), []),
    softAccountCall(() => seams.account.getNotifications(ctx), []),
  ]);

  return {
    company: {
      name: ctx.companyName,
      orgnr: ctx.orgnr,
      priceList: ctx.priceListLabel,
    },
    counts: {
      lists: lists.length,
      orders: orders.length,
      quotes: quotes.length,
      approvals: approvals.length,
      unread: notifications.filter((n) => !n.read).length,
    },
  };
}

export default function AccountLayout() {
  const {company, counts} = useLoaderData<typeof loader>();
  return (
    <div className="ac">
      <AccountSidebar company={company} counts={counts} />
      <main className="ac-main">
        <Outlet />
      </main>
    </div>
  );
}
