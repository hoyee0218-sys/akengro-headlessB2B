/* Home merchandising loaders (BASELINE-BUILD §3.2).
   Featured collections + ordered metaobject content blocks are admin-driven.
   Handles come from merchant.config — titles/images/copy from Shopify. */
import type {CustomerContext, Seams} from '~/lib/seams/types';
import {
  overlayPricesOnCollectionProducts,
  type CollectionProductNode,
} from '~/lib/collection-page';
import type {StorefrontListProduct} from '~/lib/product-page';
import {t} from '~/lib/copy';
import {catalogPath} from '~/lib/format';
import {normalizeMenuUrl} from '~/lib/menus';
import type {HomeMetaobjectRef, MerchantConfig} from '~/merchant.config';

export type HomeCollectionTile = {
  handle: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type HomeHeroCta = {
  label: string;
  url: string;
};

/** One Admin metaobject entry rendered as a Home content section. */
export type HomeContentBlock = {
  type: string;
  handle: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  collectionHandle: string | null;
  primaryCta: HomeHeroCta;
};

export type HomeHero = {
  /** Optional eyebrow; empty when Admin hero has no eyebrow field. */
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  collectionHandle: string | null;
  primaryCta: HomeHeroCta;
  secondaryCta: HomeHeroCta;
  secondaryCtaLoggedIn: HomeHeroCta;
  /** True when content came from a Storefront metaobject. */
  fromMetaobject: boolean;
  /** Source entry when hero came from homeContentBlocks. */
  metaobject?: {type: string; handle: string} | null;
};

type StorefrontClient = {
  query: (query: string, options?: Record<string, unknown>) => Promise<any>;
  CacheLong?: () => unknown;
  CacheShort?: () => unknown;
  CacheNone?: () => unknown;
};

/** Short cache for Admin-driven merchandising (home tiles / metaobjects). */
function storefrontCache(storefront: StorefrontClient): unknown {
  return (
    storefront.CacheShort?.() ??
    storefront.CacheLong?.() ??
    storefront.CacheNone?.()
  );
}

export type MetaobjectField = {
  key?: string | null;
  value?: string | null;
  type?: string | null;
  reference?: {
    __typename?: string | null;
    image?: {url?: string | null; altText?: string | null} | null;
    handle?: string | null;
    title?: string | null;
    url?: string | null;
  } | null;
};

/** Map metaobject scalar fields → a key/value record. */
export function metaobjectFieldsToMap(
  fields: MetaobjectField[] | null | undefined,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields ?? []) {
    if (!field?.key || field.value == null) continue;
    map[field.key] = String(field.value);
  }
  return map;
}

/** Parse Shopify metaobject link / URL field values. */
export function parseMetaobjectLinkValue(
  value: string | null | undefined,
): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {url?: string; href?: string};
      const url = parsed.url || parsed.href;
      if (url?.trim()) return normalizeMenuUrl(url.trim());
    } catch {
      // fall through
    }
  }
  return normalizeMenuUrl(trimmed);
}

function pickField(
  fields: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = fields[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function resolveImageAndCollection(list: MetaobjectField[]): {
  imageUrl: string | null;
  imageAlt: string | null;
  collectionHandle: string | null;
} {
  let imageUrl: string | null = null;
  let imageAlt: string | null = null;
  let collectionHandle: string | null = null;

  for (const field of list) {
    if (field.key === 'image' && field.reference?.image?.url) {
      imageUrl = field.reference.image.url;
      imageAlt = field.reference.image.altText ?? null;
    }
    if (field.key === 'collection_reference' && field.reference?.handle) {
      collectionHandle = field.reference.handle;
    }
  }

  return {imageUrl, imageAlt, collectionHandle};
}

/**
 * Normalize Admin metaobject fields into a content block.
 * Compatible with `hero_block` and similarly shaped types.
 */
export function contentBlockFromMetaobjectFields(
  ref: HomeMetaobjectRef,
  fields: MetaobjectField[] | Record<string, string>,
  defaults: Pick<HomeContentBlock, 'title' | 'body' | 'primaryCta'>,
): HomeContentBlock {
  const list: MetaobjectField[] = Array.isArray(fields)
    ? fields
    : Object.entries(fields).map(([key, value]) => ({key, value}));
  const scalars = metaobjectFieldsToMap(list);
  const {imageUrl, imageAlt, collectionHandle} = resolveImageAndCollection(list);

  const ctaUrl =
    parseMetaobjectLinkValue(
      pickField(scalars, 'button_link', 'cta_url', 'primary_cta_url'),
    ) ||
    (collectionHandle ? `/collections/${collectionHandle}` : undefined) ||
    defaults.primaryCta.url;

  return {
    type: ref.type,
    handle: ref.handle,
    title: pickField(scalars, 'heading', 'title') ?? defaults.title,
    body:
      pickField(scalars, 'subheading', 'body', 'description', 'text') ??
      defaults.body,
    imageUrl,
    imageAlt,
    collectionHandle,
    primaryCta: {
      label:
        pickField(scalars, 'button_label', 'cta_label', 'primary_cta_label') ??
        defaults.primaryCta.label,
      url: ctaUrl,
    },
  };
}

/**
 * Build hero content from a `hero_block` (or compatible) metaobject.
 * Field keys match Admin: heading, subheading, button_label, button_link,
 * image (file reference), collection_reference.
 */
export function heroFromMetaobjectFields(
  fields: MetaobjectField[] | Record<string, string>,
  defaults: HomeHero,
  ref?: HomeMetaobjectRef | null,
): HomeHero {
  const defaultsBlock = {
    title: defaults.title,
    body: defaults.body,
    primaryCta: defaults.primaryCta,
  };
  const block = contentBlockFromMetaobjectFields(
    ref ?? {type: 'hero_block', handle: 'unknown'},
    fields,
    defaultsBlock,
  );
  const list: MetaobjectField[] = Array.isArray(fields)
    ? fields
    : Object.entries(fields).map(([key, value]) => ({key, value}));
  const scalars = metaobjectFieldsToMap(list);
  const fromMetaobject = list.some((f) => Boolean(f.key));

  return {
    eyebrow:
      pickField(scalars, 'eyebrow') ?? (fromMetaobject ? '' : defaults.eyebrow),
    title: block.title,
    body: block.body,
    imageUrl: block.imageUrl,
    imageAlt: block.imageAlt,
    collectionHandle: block.collectionHandle,
    primaryCta: block.primaryCta,
    secondaryCta: {
      label:
        pickField(scalars, 'secondary_cta_label') ?? defaults.secondaryCta.label,
      url:
        parseMetaobjectLinkValue(pickField(scalars, 'secondary_cta_url')) ??
        defaults.secondaryCta.url,
    },
    secondaryCtaLoggedIn: {
      label:
        pickField(scalars, 'secondary_cta_logged_in_label') ??
        defaults.secondaryCtaLoggedIn.label,
      url:
        parseMetaobjectLinkValue(
          pickField(scalars, 'secondary_cta_logged_in_url'),
        ) ?? defaults.secondaryCtaLoggedIn.url,
    },
    fromMetaobject,
    metaobject: fromMetaobject && ref ? ref : null,
  };
}

/** Copy-layer hero fallbacks (UI chrome — not campaign merchandising). */
export function defaultHomeHero(): HomeHero {
  return {
    eyebrow: t('home.hero.eyebrow'),
    title: t('home.hero.title'),
    body: t('home.hero.body'),
    imageUrl: null,
    imageAlt: null,
    collectionHandle: null,
    primaryCta: {
      label: t('home.hero.ctaPrimary'),
      url: catalogPath(),
    },
    secondaryCta: {
      label: t('home.hero.ctaSecondary'),
      url: '/account/login',
    },
    secondaryCtaLoggedIn: {
      label: t('home.hero.ctaSecondaryLoggedIn'),
      url: '/account',
    },
    fromMetaobject: false,
    metaobject: null,
  };
}

function defaultContentBlockFallback(): Pick<
  HomeContentBlock,
  'title' | 'body' | 'primaryCta'
> {
  const hero = defaultHomeHero();
  return {
    title: hero.title,
    body: hero.body,
    primaryCta: hero.primaryCta,
  };
}

/**
 * Resolve ordered metaobject refs from config.
 * Prefers `homeContentBlocks`; falls back to legacy `homeHeroMetaobject`.
 */
export function resolveHomeContentBlockRefs(
  config: Pick<MerchantConfig, 'homeContentBlocks' | 'homeHeroMetaobject'>,
): HomeMetaobjectRef[] {
  const blocks = (config.homeContentBlocks ?? [])
    .map((ref) => ({
      type: ref.type?.trim() || '',
      handle: ref.handle?.trim() || '',
    }))
    .filter((ref) => ref.type && ref.handle);

  if (blocks.length > 0) return blocks;

  const legacy = config.homeHeroMetaobject;
  if (legacy?.type?.trim() && legacy?.handle?.trim()) {
    return [{type: legacy.type.trim(), handle: legacy.handle.trim()}];
  }

  return [];
}

/** Load one metaobject entry; null when missing. */
export async function loadHomeMetaobjectEntry(
  storefront: StorefrontClient,
  ref: HomeMetaobjectRef,
): Promise<HomeContentBlock | null> {
  try {
    const data = await storefront.query(HOME_METAOBJECT_QUERY, {
      variables: {
        handle: {type: ref.type, handle: ref.handle},
      },
      cache: storefrontCache(storefront),
    });
    const fields = (data?.metaobject?.fields ?? []) as MetaobjectField[];
    if (!data?.metaobject || fields.length === 0) return null;
    return contentBlockFromMetaobjectFields(
      {
        type: data.metaobject.type || ref.type,
        handle: data.metaobject.handle || ref.handle,
      },
      fields,
      defaultContentBlockFallback(),
    );
  } catch {
    return null;
  }
}

/**
 * Load ordered Home content blocks from Admin metaobject entries.
 * Missing handles are skipped so one bad entry does not blank the page.
 */
export async function loadHomeContentBlocks(
  storefront: StorefrontClient,
  config: Pick<MerchantConfig, 'homeContentBlocks' | 'homeHeroMetaobject'>,
): Promise<HomeContentBlock[]> {
  const refs = resolveHomeContentBlockRefs(config);
  if (refs.length === 0) return [];

  const results = await Promise.all(
    refs.map((ref) => loadHomeMetaobjectEntry(storefront, ref)),
  );

  return results.filter((block): block is HomeContentBlock => Boolean(block));
}

/**
 * Split loaded blocks into primary hero + remaining content sections.
 * First successful block becomes the hero; the rest render below.
 */
export function splitHomeHeroAndBlocks(blocks: HomeContentBlock[]): {
  hero: HomeHero;
  contentBlocks: HomeContentBlock[];
} {
  const defaults = defaultHomeHero();
  if (blocks.length === 0) {
    return {hero: defaults, contentBlocks: []};
  }

  const [first, ...rest] = blocks;
  return {
    hero: {
      ...defaults,
      eyebrow: '',
      title: first.title,
      body: first.body,
      imageUrl: first.imageUrl,
      imageAlt: first.imageAlt,
      collectionHandle: first.collectionHandle,
      primaryCta: first.primaryCta,
      fromMetaobject: true,
      metaobject: {type: first.type, handle: first.handle},
    },
    contentBlocks: rest,
  };
}

/** @deprecated Prefer loadHomeContentBlocks + splitHomeHeroAndBlocks. */
export async function loadHomeHero(
  storefront: StorefrontClient,
  config: Pick<MerchantConfig, 'homeContentBlocks' | 'homeHeroMetaobject'>,
): Promise<HomeHero> {
  const blocks = await loadHomeContentBlocks(storefront, config);
  return splitHomeHeroAndBlocks(blocks).hero;
}

/** Fetch featured collections by Admin handles; skip missing handles. */
export async function loadFeaturedCollections(
  storefront: StorefrontClient,
  handles: string[],
): Promise<HomeCollectionTile[]> {
  const unique = [...new Set(handles.map((h) => h.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const results = await Promise.all(
    unique.map(async (handle) => {
      try {
        const data = await storefront.query(HOME_FEATURED_COLLECTION_QUERY, {
          variables: {handle, first: 1},
          cache: storefrontCache(storefront),
        });
        const collection = data?.collection;
        if (!collection?.handle) return null;

        return {
          handle: collection.handle,
          title: collection.title,
          description: collection.description?.trim() || '',
          imageUrl: collection.image?.url ?? null,
          imageAlt: collection.image?.altText ?? null,
        } satisfies HomeCollectionTile;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((tile): tile is HomeCollectionTile => Boolean(tile));
}

/** Load priced products from a configured collection handle. */
export async function loadHomeProducts(
  storefront: StorefrontClient,
  seams: Seams,
  ctx: CustomerContext | null,
  handle: string,
  first = 8,
): Promise<{
  collection: {handle: string; title: string} | null;
  products: StorefrontListProduct[];
}> {
  const trimmed = handle.trim();
  if (!trimmed) return {collection: null, products: []};

  try {
    const data = await storefront.query(HOME_FEATURED_COLLECTION_QUERY, {
      variables: {handle: trimmed, first},
      cache: storefrontCache(storefront),
    });
    const collection = data?.collection;
    if (!collection?.handle) return {collection: null, products: []};

    const nodes = (collection.products?.nodes ?? []) as CollectionProductNode[];
    const products = await overlayPricesOnCollectionProducts(nodes, seams, ctx);
    return {
      collection: {handle: collection.handle, title: collection.title},
      products,
    };
  } catch {
    return {collection: null, products: []};
  }
}

export const HOME_FEATURED_COLLECTION_QUERY = `#graphql
  query HomeFeaturedCollection(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $first) {
        nodes {
          handle
          title
          vendor
          productType
          featuredImage {
            url
            altText
            width
            height
          }
          selectedOrFirstAvailableVariant(
            selectedOptions: []
            ignoreUnknownOptions: true
            caseInsensitiveMatch: true
          ) {
            id
            sku
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
` as const;

/** Generic Home metaobject entry query (hero_block and future content types). */
export const HOME_METAOBJECT_QUERY = `#graphql
  query HomeMetaobject(
    $country: CountryCode
    $language: LanguageCode
    $handle: MetaobjectHandleInput!
  ) @inContext(country: $country, language: $language) {
    metaobject(handle: $handle) {
      handle
      type
      fields {
        key
        value
        type
        reference {
          __typename
          ... on MediaImage {
            image {
              url
              altText
              width
              height
            }
          }
          ... on Collection {
            handle
            title
          }
        }
      }
    }
  }
` as const;

/** @deprecated Use HOME_METAOBJECT_QUERY. */
export const HOME_HERO_METAOBJECT_QUERY = HOME_METAOBJECT_QUERY;
