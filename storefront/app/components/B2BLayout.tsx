/* App shell selector (BUILD.md §3 app shell). Storefront chrome (header/footer)
   wraps everything EXCEPT the authenticated account section, which renders its
   own full-height sidebar layout (see routes/account.tsx). Login/logout sit
   outside the account layout and keep the storefront chrome. */
import {useLocation} from 'react-router';
import type {ReactNode} from 'react';
import {StorefrontHeader, StorefrontFooter, type NavItem} from './StorefrontChrome';

export function B2BLayout({
  nav,
  footerNav,
  loggedIn,
  cartCount,
  children,
}: {
  nav: NavItem[];
  footerNav: NavItem[];
  loggedIn: boolean;
  cartCount: number;
  children: ReactNode;
}) {
  const {pathname} = useLocation();
  const inAccountShell =
    pathname.startsWith('/account') &&
    !pathname.startsWith('/account/login') &&
    !pathname.startsWith('/account/logout');

  if (inAccountShell) {
    // The account.tsx layout route renders the .ac sidebar grid around children.
    return <>{children}</>;
  }

  return (
    <div className="sf">
      <StorefrontHeader menu={nav} loggedIn={loggedIn} cartCount={cartCount} />
      {children}
      <StorefrontFooter menu={footerNav} />
    </div>
  );
}
