/* ===========================================================================
   merchant.config.ts (BUILD.md §3)
   ---------------------------------------------------------------------------
   Non-visual, per-merchant settings the storefront and integration seams read.
   In the fleet model this + app/styles/tokens.css are the ONLY two files a
   merchant fork edits to re-skin. PUBLIC values only — never secrets.

   Visual identity lives in app/styles/tokens.css, NOT here.
   ======================================================================== */

/** One Shopify metaobject entry referenced by type + handle. */
export type HomeMetaobjectRef = {
  type: string;
  handle: string;
};

export interface MerchantConfig {
  merchantName: string;
  locale: string; // default 'nb-NO'
  currency: string; // default 'NOK'
  vatMode: 'b2b-ex-vat' | 'inc-vat';
  sparkLayer: {siteId: string}; // PUBLIC config only — no secrets here
  /**
   * Shopify collection handle used for the full-catalog PLP (`/collections/all`,
   * `/collections/alle`). Create this collection in Admin and assign products
   * so Search & Discovery filters work.
   */
  catalogCollectionHandle: string;
  /**
   * Home merchandising (BASELINE-BUILD §3.2). Collection handles created in
   * Shopify Admin; titles/images come from Storefront — never hardcode them.
   */
  featuredCollections: string[];
  /**
   * Collection whose products populate the Home product grid.
   * Leave empty to hide the product section.
   */
  homeProductsCollectionHandle: string;
  /**
   * Ordered Home content blocks from Shopify metaobject entries
   * (BASELINE-BUILD §3.2). Each item is one published entry; the storefront
   * renders them in this order. First entry drives the hero; the rest render
   * as additional content sections.
   *
   * Compatible types include `hero_block` fields: heading, subheading, image,
   * button_label, button_link, collection_reference.
   */
  homeContentBlocks: HomeMetaobjectRef[];
  /**
   * @deprecated Prefer `homeContentBlocks`. Still honored when
   * `homeContentBlocks` is empty.
   */
  homeHeroMetaobject?: {type: string; handle: string} | null;
  /**
   * Shopify Admin navigation menu handles (Content → Menus).
   * Header/footer links come from these menus — not hardcoded in components.
   */
  headerMenuHandle: string;
  footerMenuHandle: string;
  /**
   * SEO rules (BASELINE-BUILD §3.4). Filtered PLP URLs canonicalize to the
   * parent collection unless the applied filters match the whitelist.
   */
  seo?: {
    plpCanonicalWhitelist?: {
      /**
       * Exact filter sets that may self-canonicalize.
       * Single object = exactly one `?filter=`; array = multi-filter set.
       * @example exact: [{ productType: 'Bolter' }]
       */
      exact?: Array<Record<string, unknown> | Array<Record<string, unknown>>>;
      /**
       * Key-only rules (any values). Match when top-level ProductFilter keys
       * equal the set. @example keySets: [['productType']]
       */
      keySets?: string[][];
    };
  };
  features: {
    quotes: boolean;
    reorder: boolean;
    creditDisplay: boolean;
  };
  logo: {src: string; alt: string};
  favicon: string;
}

/* Demo merchant — matches the storefront/account UI kits (Nordvik Industri). */
export const merchantConfig: MerchantConfig = {
  merchantName: 'Nordvik Industri',
  locale: 'nb-NO',
  currency: 'NOK',
  vatMode: 'b2b-ex-vat',
  /** Spark dashboard Site ID. Override locally with PUBLIC_SPARKLAYER_SITE_ID. */
  sparkLayer: {siteId: 'sparklayerxconfectxscandi'}, // Replace with Spark dashboard site id (or PUBLIC_SPARKLAYER_SITE_ID)
  catalogCollectionHandle: 'all',
  // Admin collection handles — edit these (not JSX) to change Home tiles.
  featuredCollections: [
    'frontpage',
    'sandblaseutstyr',
    'verneutstyr',
    'maleutstyr',
    'blasemiddel',
    'inspeksjon',
  ],
  homeProductsCollectionHandle: 'frontpage',
  // Ordered Admin metaobject entries (Content → Metaobjects).
  // First entry = hero; additional entries = content sections below.
  homeContentBlocks: [
    {type: 'hero_block', handle: 'dieij'},
    {type: 'hero_block', handle: 'ppp'},
  ],
  // Shopify Admin → Content → Menus (default handles below).
  headerMenuHandle: 'main-menu',
  footerMenuHandle: 'footer',
  // Empty whitelist = all filtered PLPs canonicalize to the parent collection.
  // To index product-type landings, e.g.:
  //   seo: { plpCanonicalWhitelist: { keySets: [['productType']] } }
  // Or specific values:
  //   seo: { plpCanonicalWhitelist: { exact: [{ productType: 'Bolter' }] } }
  seo: {
    plpCanonicalWhitelist: {
      exact: [],
      keySets: [],
    },
  },
  features: {
    quotes: true,
    reorder: true,
    creditDisplay: true,
  },
  logo: {src: '/assets/logo.svg', alt: 'Nordvik Industri'},
  favicon: '/favicon.ico',
};

/** PriceDisplay reads this; 'ex' hides VAT in the amount and labels "eks. mva". */
export function vatLabelMode(): 'ex' | 'inc' {
  return merchantConfig.vatMode === 'inc-vat' ? 'inc' : 'ex';
}
