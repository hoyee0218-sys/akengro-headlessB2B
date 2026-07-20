import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import tokenStyles from '~/styles/tokens.css?url';
import componentStyles from '~/styles/components.css?url';
import storefrontStyles from '~/styles/storefront.css?url';
import accountStyles from '~/styles/account.css?url';
import {B2BLayout} from './components/B2BLayout';
import {CartUiProvider} from './components/CartUi';
import {QuickAddProvider} from './components/QuickAddModal';
import {SparkLayer} from './components/SparkLayer';
import {JsonLd} from './components/JsonLd';
import {resolveAuthedUser} from '~/lib/auth';
import {cartCount as cartLineCount, getCart} from '~/lib/cart';
import {loadFooterMenu, loadHeaderMenu} from '~/lib/menus';
import {integrationMode} from '~/lib/seams';
import {resolveSparkSession} from '~/lib/spark';
import {organizationJsonLd} from '~/lib/seo';
import {t} from '~/lib/copy';
import {merchantConfig} from '~/merchant.config';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preconnect',
      href: 'https://sparkcdn.io',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;
  const origin = new URL(args.request.url).origin;

  return {
    ...deferredData,
    ...criticalData,
    // Same auth truth as critical `loggedIn`, Promise-shaped for scaffold Header.
    isLoggedIn: Promise.resolve(criticalData.loggedIn),
    origin,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront, session, customerAccount, env} = context;

  // One auth resolve only — avoid a second Customer Account isLoggedIn() hop.
  const [headerMenu, footerNav, user] = await Promise.all([
    loadHeaderMenu(storefront, merchantConfig),
    loadFooterMenu(storefront, merchantConfig),
    resolveAuthedUser({session, customerAccount, env}),
  ]);

  const loggedIn = Boolean(user);
  const cartLines = getCart(session);
  const cartCount = cartLineCount(session);
  const siteId =
    env.PUBLIC_SPARKLAYER_SITE_ID?.trim() || merchantConfig.sparkLayer.siteId;
  const sparkSession = resolveSparkSession({
    user,
    siteId,
    integrationMode: integrationMode(env),
  });

  return {
    header: headerMenu.headerQuery,
    nav: headerMenu.menu,
    footerNav,
    loggedIn,
    cartCount,
    cartLines,
    sparkSession,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {cart} = context;

  return {
    cart: cart.get(),
    // Footer menu is loaded in critical data for the B2B chrome; keep key for
    // scaffold PageLayout consumers that still Await `footer`.
    footer: Promise.resolve(null),
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="nb">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={tokenStyles}></link>
        <link rel="stylesheet" href={componentStyles}></link>
        <link rel="stylesheet" href={storefrontStyles}></link>
        <link rel="stylesheet" href={accountStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      {/* BASELINE-BUILD §3.4: sitewide Organization JSON-LD from merchant identity. */}
      <JsonLd
        data={organizationJsonLd(data.origin, {
          name: merchantConfig.merchantName,
          logoUrl: merchantConfig.logo?.src
            ? new URL(merchantConfig.logo.src, data.origin).toString()
            : null,
        })}
      />
      <CartUiProvider>
        <QuickAddProvider>
          {/* BASELINE §4.2: Spark JS only when sparkSession is non-null. */}
          <SparkLayer session={data.sparkSession} />
          <B2BLayout
            nav={data.nav}
            footerNav={data.footerNav}
            loggedIn={data.loggedIn}
            cartCount={data.cartCount}
          >
            <Outlet />
          </B2BLayout>
        </QuickAddProvider>
      </CartUiProvider>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = t('error.unknown');
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>{t('error.oops')}</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
