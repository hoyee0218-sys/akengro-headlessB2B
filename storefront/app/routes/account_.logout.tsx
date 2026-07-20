/* Logout (BUILD.md §6). Mock: clear demo session + cart. Real: Customer Account logout. */
import {redirect} from 'react-router';
import type {Route} from './+types/account_.logout';
import {logOutDemo} from '~/lib/auth';
import {clearCart} from '~/lib/cart';
import {integrationMode} from '~/lib/seams';

export async function loader() {
  return redirect('/');
}

export async function action({context}: Route.ActionArgs) {
  const {session, customerAccount, env} = context;
  clearCart(session);

  if (integrationMode(env) === 'real') {
    return customerAccount.logout();
  }

  logOutDemo(session);
  return redirect('/');
}
