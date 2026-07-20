/* SEO helpers (BASELINE-BUILD §3.4): JSON-LD + absolute URLs from real store data. */
import {merchantConfig} from '~/merchant.config';
import {catalogPath, productPath, type BreadcrumbCollection} from '~/lib/format';
import {t} from '~/lib/copy';

export type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Absolute URL for SEO tags / JSON-LD (pathname only, no search). */
export function absoluteUrl(origin: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, origin).toString();
}

/** schema.org BreadcrumbList for PLP / other listing pages. */
export function breadcrumbListJsonLd(
  origin: string,
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(origin, item.path),
    })),
  };
}

/** Home → collection breadcrumb for PLP. */
export function collectionBreadcrumbJsonLd(
  origin: string,
  collection: {title: string; handle: string},
): Record<string, unknown> {
  return breadcrumbListJsonLd(origin, [
    {name: t('nav.home'), path: '/'},
    {
      name: collection.title,
      path: `/collections/${collection.handle}`,
    },
  ]);
}

/**
 * Home → catalog → [collection] → product breadcrumb for PDP.
 * Mirrors the visible crumb trail on the product page.
 */
export function productBreadcrumbJsonLd(
  origin: string,
  product: {title: string; handle: string},
  collection?: BreadcrumbCollection | null,
): Record<string, unknown> {
  const items: BreadcrumbItem[] = [
    {name: t('nav.home'), path: '/'},
    {name: t('nav.catalog'), path: catalogPath()},
  ];
  if (collection?.handle && collection.title) {
    items.push({
      name: collection.title,
      path: `/collections/${collection.handle}`,
    });
  }
  items.push({
    name: product.title,
    path: productPath(product.handle, {
      collection: collection?.handle,
    }),
  });
  return breadcrumbListJsonLd(origin, items);
}

/** schema.org CollectionPage for the PLP document. */
export function collectionPageJsonLd(
  origin: string,
  collection: {
    title: string;
    handle: string;
    description?: string | null;
  },
): Record<string, unknown> {
  const url = absoluteUrl(origin, `/collections/${collection.handle}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description || undefined,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: merchantConfig.merchantName,
      url: absoluteUrl(origin, '/'),
    },
  };
}

/**
 * schema.org Organization for the storefront brand identity.
 * Uses merchant config + request origin (not placeholder CMS copy).
 */
export function organizationJsonLd(
  origin: string,
  options?: {
    name?: string;
    logoUrl?: string | null;
    description?: string | null;
  },
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options?.name || merchantConfig.merchantName,
    url: absoluteUrl(origin, '/'),
  };
  if (options?.description) {
    json.description = options.description;
  }
  if (options?.logoUrl) {
    json.logo = options.logoUrl;
  }
  return json;
}

export type ProductJsonLdInput = {
  title: string;
  handle: string;
  description?: string | null;
  productType?: string | null;
  vendor?: string | null;
  imageUrl?: string | null;
  sku?: string | null;
  priceAmount?: string | number | null;
  priceCurrency?: string | null;
  availableForSale?: boolean | null;
  collectionHandle?: string | null;
};

/** schema.org Product + Offer from Storefront product/variant fields. */
export function productJsonLd(
  origin: string,
  product: ProductJsonLdInput,
): Record<string, unknown> {
  const url = absoluteUrl(origin, productPath(product.handle));
  const currency =
    product.priceCurrency?.trim() || merchantConfig.currency || 'NOK';
  const amount =
    product.priceAmount === null || product.priceAmount === undefined
      ? null
      : String(product.priceAmount);

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: currency,
    availability: product.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  };
  if (amount !== null && amount !== '') {
    offers.price = amount;
  }

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || undefined,
    url,
    productID: product.handle,
    sku: product.sku || undefined,
    category: product.productType || undefined,
    offers,
  };

  if (product.imageUrl) {
    json.image = product.imageUrl;
  }
  if (product.vendor) {
    json.brand = {
      '@type': 'Brand',
      name: product.vendor,
    };
  }

  return json;
}
