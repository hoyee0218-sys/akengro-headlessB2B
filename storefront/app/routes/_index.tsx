/* Home (BASELINE-BUILD §3.2). Merchandising from Admin via merchant.config
   handles + ordered metaobject content blocks — no hardcoded campaign content. */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams, softAccountCall} from '~/lib/seams';
import {
  loadFeaturedCollections,
  loadHomeContentBlocks,
  loadHomeProducts,
  splitHomeHeroAndBlocks,
  type HomeContentBlock,
} from '~/lib/home';
import {catalogPath, money, productPath} from '~/lib/format';
import {t} from '~/lib/copy';
import {merchantConfig} from '~/merchant.config';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {ProductCard} from '~/components/ds/ProductCard';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';
import {useQuickAdd} from '~/components/QuickAddModal';

export const meta: Route.MetaFunction = () => [
  {title: `${merchantConfig.merchantName} — ${t('home.metaTitle')}`},
];

export async function loader({context}: Route.LoaderArgs) {
  const {env, session, storefront, customerAccount} = context;
  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);

  const [contentBlocks, featuredCollections, homeProducts, orders] =
    await Promise.all([
      loadHomeContentBlocks(storefront, merchantConfig),
      loadFeaturedCollections(storefront, merchantConfig.featuredCollections),
      loadHomeProducts(
        storefront,
        seams,
        ctx,
        merchantConfig.homeProductsCollectionHandle,
        8,
      ),
      ctx
        ? softAccountCall(() => seams.account.getOrderHistory(ctx), [])
        : Promise.resolve([]),
    ]);

  const {hero, contentBlocks: extraBlocks} =
    splitHomeHeroAndBlocks(contentBlocks);

  let account = null;
  if (ctx) {
    const open = orders.filter((o) =>
      ['shipped', 'confirmed', 'processing', 'pending'].includes(o.status),
    ).length;
    account = {
      priceList: ctx.priceListLabel,
      terms: ctx.terms,
      openOrders: open,
      creditFree: ctx.credit.limit - ctx.credit.used,
    };
  }

  return {
    loggedIn: Boolean(ctx),
    hero,
    contentBlocks: extraBlocks,
    featuredCollections,
    productsCollection: homeProducts.collection,
    products: homeProducts.products,
    account,
  };
}

function ContentBlockSection({block}: {block: HomeContentBlock}) {
  return (
    <section
      className="sf-content-block"
      data-metaobject-type={block.type}
      data-metaobject-handle={block.handle}
    >
      <div
        className="sf-content-block__in"
        data-has-media={Boolean(block.imageUrl) || undefined}
      >
        <div className="sf-content-block__copy">
          <h2>{block.title}</h2>
          {block.body ? <p>{block.body}</p> : null}
          {block.primaryCta.label ? (
            <div className="sf-content-block__cta">
              <Button as={Link} to={block.primaryCta.url} size="lg">
                {block.primaryCta.label}
              </Button>
            </div>
          ) : null}
        </div>
        {block.imageUrl ? (
          <div className="sf-content-block__media">
            <img
              src={block.imageUrl}
              alt={block.imageAlt || block.title}
              loading="lazy"
              className="sf-content-block__img"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function Home() {
  const {
    loggedIn,
    hero,
    contentBlocks,
    featuredCollections,
    productsCollection,
    products,
    account,
  } = useLoaderData<typeof loader>();
  const {openQuickAdd} = useQuickAdd();
  const secondaryCta = loggedIn ? hero.secondaryCtaLoggedIn : hero.secondaryCta;
  const productsHeading =
    productsCollection?.title?.trim() || t('home.featured');
  const productsHref = productsCollection?.handle
    ? `/collections/${productsCollection.handle}`
    : catalogPath();

  return (
    <main>
      <section
        className="sf-hero"
        data-from-metaobject={hero.fromMetaobject || undefined}
        data-metaobject-handle={hero.metaobject?.handle || undefined}
      >
        <div
          className="sf-hero__in"
          data-has-media={Boolean(hero.imageUrl) || undefined}
        >
          <div>
            {hero.eyebrow ? (
              <div className="sf-hero__eyebrow">{hero.eyebrow}</div>
            ) : null}
            <h1>{hero.title}</h1>
            {hero.body ? <p>{hero.body}</p> : null}
            <div className="sf-hero__cta">
              <Button as={Link} to={hero.primaryCta.url} size="lg">
                {hero.primaryCta.label}
              </Button>
              <Button
                as={Link}
                to={secondaryCta.url}
                size="lg"
                variant="secondary"
                iconEnd={<Icon name="arrow-right" size={16} />}
              >
                {secondaryCta.label}
              </Button>
            </div>
          </div>
          {hero.imageUrl ? (
            <div className="sf-hero__media">
              <img
                src={hero.imageUrl}
                alt={hero.imageAlt || hero.title}
                className="sf-hero__img"
              />
            </div>
          ) : null}
          <div className="sf-hero__panel">
            <div className="sf-hero__panel-head">
              <h3>{t('home.account.title')}</h3>
              <DemoDataBadge />
            </div>
            {loggedIn && account ? (
              <>
                <div className="sf-stat">
                  <span className="sf-stat__k">{t('home.account.priceList')}</span>
                  <span className="sf-stat__v">{account.priceList}</span>
                </div>
                <div className="sf-stat">
                  <span className="sf-stat__k">{t('home.account.terms')}</span>
                  <span className="sf-stat__v">{account.terms}</span>
                </div>
                <div className="sf-stat">
                  <span className="sf-stat__k">{t('home.account.openOrders')}</span>
                  <span className="sf-stat__v">{account.openOrders}</span>
                </div>
                <div className="sf-stat">
                  <span className="sf-stat__k">
                    {t('home.account.creditAvailable')}
                  </span>
                  <span className="sf-stat__v">{money(account.creditFree)}</span>
                </div>
                <Button as={Link} to="/account" block style={{marginTop: 16}}>
                  {t('home.account.goToAccount')}
                </Button>
              </>
            ) : (
              <>
                <p className="sf-hero__panel-hint">{t('home.account.guestHint')}</p>
                <Button as={Link} to="/account/login" block>
                  {t('home.account.login')}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {contentBlocks.map((block) => (
        <ContentBlockSection key={`${block.type}:${block.handle}`} block={block} />
      ))}

      <div className="sf__wrap">
        {featuredCollections.length > 0 ? (
          <section className="sf-sec">
            <div className="sf-sec__head">
              <h2>{t('home.categories')}</h2>
              <Link to="/collections" style={{fontSize: 'var(--scale-sm)'}}>
                {t('home.seeAll')}
              </Link>
            </div>
            <div className="sf-cats">
              {featuredCollections.map((c) => (
                <Link
                  key={c.handle}
                  to={`/collections/${c.handle}`}
                  className="sf-cat"
                  style={{textDecoration: 'none', color: 'inherit'}}
                  prefetch="intent"
                >
                  <div
                    className="sf-cat__media"
                    data-has-image={Boolean(c.imageUrl) || undefined}
                  >
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.imageAlt || c.title}
                        loading="lazy"
                        className="sf-cat__img"
                      />
                    ) : (
                      <Icon
                        name="package"
                        size={32}
                        style={{color: 'var(--text-secondary)'}}
                      />
                    )}
                  </div>
                  <div>
                    <div className="sf-cat__name">{c.title}</div>
                    {c.description ? (
                      <div className="sf-cat__n">{c.description}</div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {products.length > 0 ? (
          <section
            className="sf-sec"
            style={{paddingTop: featuredCollections.length > 0 ? 0 : undefined}}
          >
            <div className="sf-sec__head">
              <h2>{productsHeading}</h2>
              <Link to={productsHref} style={{fontSize: 'var(--scale-sm)'}}>
                {t('home.fullCatalog')}
              </Link>
            </div>
            <div className="sf-grid">
              {products.map((p) => (
                <ProductCard
                  key={p.handle}
                  title={p.title}
                  sku={p.sku}
                  image={p.imageUrl}
                  amount={p.price.amount}
                  listAmount={p.price.listAmount}
                  currency={p.price.currency}
                  gated={p.price.gated}
                  stockStatus={p.stock}
                  href={productPath(p.handle)}
                  onAddToCart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (p.price.gated || p.stock === 'out') return;
                    openQuickAdd(p.handle);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
