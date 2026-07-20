/* Custom login UI (BUILD.md §6 / BASELINE §4.1).
   Identity is Shopify's (Customer Account API). Mock: demo session stub.
   Real: customerAccount.login() OAuth. Verified B2B → /account. Shopify session
   without B2B tag+metafield stays here with an explanation (no /?b2b=required). */
import {Form, redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account_.login';
import {logInDemo, resolveAuthedUser} from '~/lib/auth';
import {seedDemoCart} from '~/lib/cart';
import {getCustomerContext, integrationMode} from '~/lib/seams';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';

export const meta: Route.MetaFunction = () => [
  {title: t('login.metaTitle')},
];

export async function loader({context}: Route.LoaderArgs) {
  const {session, customerAccount, env} = context;
  const user = await resolveAuthedUser({session, customerAccount, env});
  const mode = integrationMode(env);

  if (!user) {
    return {mode, gate: 'login' as const, email: null as string | null};
  }

  const ctx = await getCustomerContext(env, user);
  if (ctx) {
    throw redirect('/account');
  }

  // Shopify identity OK; B2B verification failed (BASELINE §4.1 tag + metafield).
  return {
    mode,
    gate: 'b2b' as const,
    email: user.email ?? null,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const {session, customerAccount, env} = context;

  if (integrationMode(env) === 'real') {
    const url = new URL(request.url);
    const loginHint = url.searchParams.get('login_hint') ?? undefined;
    const acrValues = url.searchParams.get('acr_values') ?? undefined;
    const locale = url.searchParams.get('locale') ?? undefined;
    return customerAccount.login({
      ...(loginHint ? {loginHint} : {}),
      ...(acrValues ? {acrValues} : {}),
      ...(locale ? {locale} : {}),
    });
  }

  logInDemo(session);
  seedDemoCart(session);
  return redirect('/account');
}

export default function Login() {
  const data = useLoaderData<typeof loader>();
  const isReal = data.mode === 'real';

  if (data.gate === 'b2b') {
    return (
      <main>
        <div
          className="sf__wrap"
          style={{maxWidth: 460, padding: 'var(--space-16) var(--space-6)'}}
        >
          <div className="sf-hero__panel">
            <h3
              style={{
                font: 'var(--weight-bold) var(--scale-xl)/1.1 var(--font-display)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 16,
              }}
            >
              {t('login.b2bRequired.title')}
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--scale-sm)',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.5,
              }}
            >
              {data.email
                ? t('login.b2bRequired.bodyWithEmail', {email: data.email})
                : t('login.b2bRequired.body')}
            </p>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--scale-xs)',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.5,
              }}
            >
              {t('login.b2bRequired.checklist')}
            </p>
            <Form method="post" action="/account/logout">
              <Button
                type="submit"
                block
                size="lg"
                variant="secondary"
                iconStart={<Icon name="user" size={16} />}
              >
                {t('login.b2bRequired.logout')}
              </Button>
            </Form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div
        className="sf__wrap"
        style={{maxWidth: 460, padding: 'var(--space-16) var(--space-6)'}}
      >
        <div className="sf-hero__panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                font: 'var(--weight-bold) var(--scale-xl)/1.1 var(--font-display)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              {t('login.title')}
            </h3>
            {!isReal ? <DemoDataBadge /> : null}
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--scale-sm)',
              marginBottom: 'var(--space-5)',
            }}
          >
            {isReal ? t('login.bodyReal') : t('login.bodyDemo')}
          </p>
          <Form method="post">
            <Button
              type="submit"
              block
              size="lg"
              iconStart={<Icon name="user" size={16} />}
            >
              {isReal ? t('login.ctaReal') : t('login.ctaDemo')}
            </Button>
          </Form>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--scale-xs)',
              marginTop: 'var(--space-4)',
              lineHeight: 1.5,
            }}
          >
            {t('login.footnote')}
          </p>
        </div>
      </div>
    </main>
  );
}
