/* PDP (BUILD.md §4 / ui_kits/storefront PDP).
   Product content from Shopify Storefront API; price + qty-break slots from the
   seams (PricingProvider). Add-to-cart targets the B2B cart seam (lib/cart) —
   NOT the Storefront cart — and keeps the buyer on the page (mini-cart feedback).
   Gated for logged-out visitors. */
import {Link, useFetcher, useLoaderData, useLocation} from 'react-router';
import {useEffect, useMemo, useState} from 'react';
import type {Route} from './+types/products.$handle';
import {
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  getSelectedProductOptions,
  Image,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {resolveAuthedUser} from '~/lib/auth';
import {
  getPriceForCustomerSafe,
  getQuantityBreaksSafe,
  getCustomerContext,
  getSeams,
} from '~/lib/seams';
import {applyCartAdd, type CartAddResult} from '~/lib/cart-add';
import {formatVariantTitle} from '~/lib/cart';
import {useCartAddFeedback} from '~/components/CartUi';
import {
  catalogPath,
  resolveProductBreadcrumbCollection,
} from '~/lib/format';
import {
  overlayPriceWithStorefront,
  productQueryVariables,
  variantStockStatus,
} from '~/lib/product-page';
import {
  isOptionValueInStock,
  isOptionValueSelectable,
} from '~/lib/product-stock';
import {getVariantUrl} from '~/lib/variants';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Icon} from '~/components/ds/Icon';
import {Badge} from '~/components/ds/Badge';
import {Button} from '~/components/ds/Button';
import {PriceDisplay} from '~/components/ds/PriceDisplay';
import {StockIndicator} from '~/components/ds/StockIndicator';
import {QuantityStepper} from '~/components/ds/QuantityStepper';
import {QtyBreakTable} from '~/components/ds/QtyBreakTable';
import {DemoDataBadge} from '~/components/ds/DemoDataBadge';
import {t} from '~/lib/copy';
import {merchantConfig} from '~/merchant.config';
import {
  productBreadcrumbJsonLd,
  productJsonLd,
} from '~/lib/seo';
import {JsonLd} from '~/components/JsonLd';

export const meta: Route.MetaFunction = ({data}) => [
  {
    title:
      data?.product?.seo?.title ??
      `${data?.product?.title ?? t('pdp.metaFallback')} — ${merchantConfig.merchantName}`,
  },
  ...(data?.product?.seo?.description
    ? [{name: 'description' as const, content: data.product.seo.description}]
    : []),
];

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {env, session, storefront, customerAccount} = context;
  const handle = params.handle;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);

  // CacheShort: inventory may lag a few seconds — better TTFB than CacheNone.
  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: productQueryVariables(handle, request),
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!product?.id) {
    throw new Response(t('pdp.notFound'), {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const selectedVariant = product.selectedOrFirstAvailableVariant;
  const pricingKey = selectedVariant?.sku || handle;

  const [seamPrice, breaks] = await Promise.all([
    getPriceForCustomerSafe(seams, pricingKey, ctx),
    selectedVariant
      ? getQuantityBreaksSafe(
          seams,
          selectedVariant.sku || selectedVariant.id,
          ctx,
        )
      : Promise.resolve([]),
  ]);

  // PricingProvider is the seam; when mock has no fixture for this SKU,
  // overlay Storefront variant Money so PDP shows per-product store prices.
  // listAmount / strikethrough only when compareAt (or fixture list) is a markdown.
  const price = overlayPriceWithStorefront(seamPrice, selectedVariant);
  const origin = new URL(request.url).origin;

  return {
    product,
    price,
    breaks,
    loggedIn: Boolean(ctx),
    selectedOptions: getSelectedProductOptions(request),
    origin,
  };
}

export async function action({context, params, request}: Route.ActionArgs) {
  const form = await request.formData();
  // B2B cart seam — stay on the PDP; client opens the mini-cart on success.
  return applyCartAdd(context.session, form, params.handle);
}

type GalleryImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

function productImages(product: {
  featuredImage?: GalleryImage | null;
  media?: {nodes?: Array<{id?: string; image?: GalleryImage | null} | null>} | null;
}): GalleryImage[] {
  const fromMedia =
    product.media?.nodes
      ?.map((node) => node?.image)
      .filter((image): image is GalleryImage => Boolean(image?.url)) ?? [];

  if (fromMedia.length > 0) return fromMedia;
  if (product.featuredImage?.url) return [product.featuredImage];
  return [];
}

export default function Product() {
  const {product, price, breaks, loggedIn, origin} =
    useLoaderData<typeof loader>();
  const {pathname, search} = useLocation();
  const initialQty = breaks[1] ? breaks[1].minQty : 1;
  const [qty, setQty] = useState(initialQty);
  const fetcher = useFetcher<CartAddResult>();
  useCartAddFeedback(fetcher);

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const images = useMemo(() => {
    const gallery = productImages(product);
    const variantImage = selectedVariant?.image;
    if (variantImage?.url && !gallery.some((img) => img.url === variantImage.url)) {
      return [variantImage, ...gallery];
    }
    return gallery;
  }, [product, selectedVariant]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Prefer the selected variant image when options change.
  useEffect(() => {
    const variantUrl = selectedVariant?.image?.url;
    if (!variantUrl) return;
    const idx = images.findIndex((img) => img.url === variantUrl);
    if (idx >= 0) setActiveImageIndex(idx);
  }, [selectedVariant?.image?.url, images]);

  const activeImage = images[activeImageIndex] ?? images[0] ?? selectedVariant?.image;
  const stock = variantStockStatus(selectedVariant);
  const category = product.productType || product.vendor || '';
  const breadcrumbCollection = resolveProductBreadcrumbCollection({
    collections: product.collections?.nodes ?? [],
    preferredHandle: new URLSearchParams(search).get('collection'),
  });
  const showOptions = productOptions.some((option) => option.optionValues.length > 1);

  // Re-overlay against the selected/optimistic variant so selling price +
  // Storefront compare-at update when the shopper changes Size/Color.
  // Preserve Spark `storefrontMultiplier` — without it PDP falls back to origin.
  const displayPrice = useMemo(() => {
    if (price.gated) return price;
    return overlayPriceWithStorefront(
      {
        amount: null,
        listAmount: null,
        currency: price.currency,
        gated: false,
        demo: price.demo,
        storefrontMultiplier: price.storefrontMultiplier ?? null,
      },
      selectedVariant,
    );
  }, [price, selectedVariant]);

  // SEO Product JSON-LD uses Storefront Money (not gated B2B seam price).
  const storefrontOfferPrice = selectedVariant?.price;
  const productImageUrl =
    activeImage?.url ||
    selectedVariant?.image?.url ||
    product.featuredImage?.url ||
    null;

  return (
    <main>
      <JsonLd
        data={productBreadcrumbJsonLd(
          origin,
          {title: product.title, handle: product.handle},
          breadcrumbCollection,
        )}
      />
      <JsonLd
        data={productJsonLd(origin, {
          title: product.title,
          handle: product.handle,
          description: product.description || product.seo?.description,
          productType: product.productType,
          vendor: product.vendor,
          imageUrl: productImageUrl,
          sku: selectedVariant?.sku,
          priceAmount: storefrontOfferPrice?.amount,
          priceCurrency: storefrontOfferPrice?.currencyCode,
          availableForSale: selectedVariant?.availableForSale,
          collectionHandle: breadcrumbCollection?.handle,
        })}
      />
      <div className="sf__wrap">
        <div className="sf-crumb">
          <Link to="/">{t('nav.home')}</Link> <Icon name="chevron-right" size={13} />{' '}
          <Link to={catalogPath()}>{t('nav.catalog')}</Link>{' '}
          <Icon name="chevron-right" size={13} />{' '}
          {breadcrumbCollection ? (
            <>
              <Link to={`/collections/${breadcrumbCollection.handle}`}>
                {breadcrumbCollection.title}
              </Link>{' '}
              <Icon name="chevron-right" size={13} />{' '}
            </>
          ) : null}
          <span>{selectedVariant?.sku || product.handle}</span>
        </div>

        <div className="sf-pdp">
          <div className="sf-pdp__gallery">
            <div className="sf-pdp__media" data-has-image={Boolean(activeImage) || undefined}>
              {price.demo && <DemoDataBadge corner />}
              {activeImage?.url ? (
                <Image
                  data={activeImage}
                  alt={activeImage.altText || product.title}
                  sizes="(min-width: 53.75em) 50vw, 100vw"
                  loading="eager"
                  className="sf-pdp__media-img"
                />
              ) : (
                <div className="sf-pdp__media-empty">
                  <Icon name="image" size={84} />
                  <span>{t('pdp.noImage')}</span>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="sf-pdp__thumbs" role="list">
                {images.map((image, i) => (
                  <button
                    key={`${image.url}-${i}`}
                    type="button"
                    className="sf-pdp__thumb"
                    role="listitem"
                    aria-label={t('pdp.showImage', {n: i + 1})}
                    aria-current={i === activeImageIndex || undefined}
                    onClick={() => setActiveImageIndex(i)}
                  >
                    <Image data={image} alt="" sizes="80px" width={72} height={72} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sf-pdp__info">
            {category ? <Badge tone="outline">{category}</Badge> : null}
            <h1>{product.title}</h1>
            {selectedVariant?.sku ? (
              <div className="sf-pdp__sku">
                {t('pdp.sku', {sku: selectedVariant.sku})}
              </div>
            ) : (
              <div className="sf-pdp__sku">
                {t('pdp.handle', {handle: product.handle})}
              </div>
            )}
            <StockIndicator status={stock} />

            {showOptions && (
              <div className="sf-pdp__options">
                {productOptions.map((option) => (
                  <fieldset key={option.name} className="sf-pdp__option-set">
                    <legend>{option.name}</legend>
                    <div className="sf-pdp__option-values">
                      {option.optionValues.map((value) => {
                        const selectable = isOptionValueSelectable(value);
                        const inStock = isOptionValueInStock(value);
                        const nextOptions = [
                          ...(selectedVariant?.selectedOptions ?? []).filter(
                            (selected) => selected.name !== option.name,
                          ),
                          {name: option.name, value: value.name},
                        ];
                        const href = getVariantUrl({
                          handle: product.handle,
                          pathname,
                          searchParams: new URLSearchParams(),
                          selectedOptions: nextOptions,
                        });

                        return (
                          <Link
                            key={`${option.name}-${value.name}`}
                            to={href}
                            prefetch="intent"
                            aria-current={value.selected || undefined}
                            aria-disabled={!selectable || undefined}
                            className={[
                              'sf-pdp__option',
                              value.selected ? 'sf-pdp__option--active' : '',
                              selectable && !inStock
                                ? 'sf-pdp__option--unavailable'
                                : '',
                              !selectable ? 'sf-pdp__option--missing' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={(event) => {
                              // Only block combinations that do not exist.
                              // Sold-out sizes stay selectable (CTA shows Utsolgt).
                              if (!selectable) event.preventDefault();
                            }}
                          >
                            {value.name}
                          </Link>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}

            <div className="sf-pdp__priceblock">
              {loggedIn && !displayPrice.gated && displayPrice.amount != null ? (
                <PriceDisplay
                  amount={displayPrice.amount}
                  listAmount={displayPrice.listAmount}
                  currency={displayPrice.currency}
                  vatMode="ex"
                  size="lg"
                />
              ) : (
                <PriceDisplay gated />
              )}
            </div>

            <fetcher.Form method="post" className="sf-pdp__buy">
              <input type="hidden" name="qty" value={qty} />
              <input
                type="hidden"
                name="productId"
                value={selectedVariant?.sku || product.handle}
              />
              <input type="hidden" name="title" value={product.title} />
              <input
                type="hidden"
                name="sku"
                value={selectedVariant?.sku || ''}
              />
              <input type="hidden" name="handle" value={product.handle} />
              <input
                type="hidden"
                name="amount"
                value={
                  displayPrice.amount != null ? String(displayPrice.amount) : ''
                }
              />
              <input
                type="hidden"
                name="currency"
                value={displayPrice.currency || ''}
              />
              <input
                type="hidden"
                name="imageUrl"
                value={
                  selectedVariant?.image?.url ||
                  images[activeImageIndex]?.url ||
                  product.featuredImage?.url ||
                  ''
                }
              />
              <input
                type="hidden"
                name="variantTitle"
                value={formatVariantTitle(selectedVariant?.selectedOptions) || ''}
              />
              <QuantityStepper value={qty} min={1} step={1} unit={t('qty.unit')} onChange={setQty} />
              <Button
                type="submit"
                size="lg"
                disabled={!loggedIn || stock === 'out'}
                iconStart={<Icon name="shopping-cart" size={16} />}
              >
                {stock === 'out' ? t('stock.out') : t('product.addToCartLong')}
              </Button>
              <Button size="lg" variant="secondary" type="button" disabled={!loggedIn}>
                {t('product.requestQuote')}
              </Button>
            </fetcher.Form>
            {!loggedIn && (
              <p className="sf-pdp__gate-hint">
                {t('pdp.gateHint')}
              </p>
            )}

            {(product.descriptionHtml || product.description) && (
              <div className="sf-pdp__description">
                <h2>{t('pdp.description')}</h2>
                {product.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
                ) : (
                  <p>{product.description}</p>
                )}
              </div>
            )}

            <dl className="sf-pdp__meta">
              {product.vendor ? (
                <>
                  <dt>{t('pdp.vendor')}</dt>
                  <dd>{product.vendor}</dd>
                </>
              ) : null}
              {product.productType ? (
                <>
                  <dt>{t('pdp.productType')}</dt>
                  <dd>{product.productType}</dd>
                </>
              ) : null}
              {selectedVariant?.title && selectedVariant.title !== 'Default Title' ? (
                <>
                  <dt>{t('pdp.variant')}</dt>
                  <dd>{selectedVariant.title}</dd>
                </>
              ) : null}
              <dt>{t('pdp.stockStatus')}</dt>
              <dd>{stock === 'in' ? t('stock.in') : t('stock.out')}</dd>
              <dt>{t('pdp.priceList')}</dt>
              <dd>{loggedIn ? 'Engros A' : '—'}</dd>
              <dt>{t('pdp.vat')}</dt>
              <dd>{t('price.exVat')}</dd>
            </dl>

            {loggedIn && breaks.length > 0 && (
              <div className="sf-pdp__breaks">
                <h4>{t('qty.breaksHeading')}</h4>
                <QtyBreakTable
                  currentQty={qty}
                  breaks={breaks}
                  currency={displayPrice.currency}
                  unit={t('qty.unit')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    collections(first: 20) {
      nodes {
        id
        title
        handle
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    media(first: 20) {
      nodes {
        ... on MediaImage {
          id
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
