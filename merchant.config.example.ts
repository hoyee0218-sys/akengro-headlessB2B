/* ===========================================================================
   merchant.config.ts — EXAMPLE (§1)
   ---------------------------------------------------------------------------
   Non-visual, per-merchant settings the storefront and integration seams read.
   In a generated merchant repo this is the second file (besides tokens.css) a
   fork edits. Visual identity lives in app/styles/tokens.css — NOT here.
   ======================================================================== */

/** One Shopify metaobject entry referenced by type + handle. */
export type HomeMetaobjectRef = {
  type: string;
  handle: string;
};

export interface MerchantConfig {
  merchantName: string;
  locale: string;                 // default 'nb-NO'
  currency: string;               // default 'NOK'
  vatMode: 'b2b-ex-vat' | 'inc-vat';
  sparkLayer: { siteId: string };  // PUBLIC config only — no secrets here
  /** Shopify collection handle for the full-catalog PLP (/collections/all). */
  catalogCollectionHandle: string;
  /**
   * Home featured collection handles (BASELINE-BUILD §3.2).
   * Titles/images come from Shopify Admin — do not hardcode in JSX.
   */
  featuredCollections: string[];
  /** Collection whose products fill the Home product grid (empty = hide). */
  homeProductsCollectionHandle: string;
  /**
   * Ordered Home content blocks (metaobject entries). First = hero;
   * additional entries render as sections. Supports multiple types/handles.
   */
  homeContentBlocks: HomeMetaobjectRef[];
  /** @deprecated Prefer homeContentBlocks. */
  homeHeroMetaobject?: { type: string; handle: string } | null;
  /** Shopify Admin menu handles (Content → Menus) for header/footer nav. */
  headerMenuHandle: string;
  footerMenuHandle: string;
  /**
   * Filtered PLP → canonical to parent unless whitelisted (BASELINE-BUILD §3.4).
   * Leave empty to never index filtered URLs.
   */
  seo?: {
    plpCanonicalWhitelist?: {
      exact?: Array<Record<string, unknown> | Array<Record<string, unknown>>>;
      keySets?: string[][];
    };
  };
  features: {
    quotes: boolean;
    reorder: boolean;
    creditDisplay: boolean;
  };
  logo: { src: string; alt: string };
  favicon: string;
}

/* Example merchant (the demo storefront in ui_kits/). */
export const merchantConfig: MerchantConfig = {
  merchantName: 'Nordvik Industri',
  locale: 'nb-NO',
  currency: 'NOK',
  vatMode: 'b2b-ex-vat',
  sparkLayer: { siteId: 'demo-site-id' },
  catalogCollectionHandle: 'all',
  featuredCollections: [
    'sandblaseutstyr',
    'verneutstyr',
    'maleutstyr',
    'blasemiddel',
    'inspeksjon',
  ],
  homeProductsCollectionHandle: 'frontpage',
  homeContentBlocks: [
    { type: 'hero_block', handle: 'ppp' },
    { type: 'hero_block', handle: 'dieij' },
  ],
  headerMenuHandle: 'main-menu',
  footerMenuHandle: 'footer',
  seo: {
    plpCanonicalWhitelist: {
      // Index any single product-type filter landing:
      // keySets: [['productType']],
      // Or only specific values:
      // exact: [{ productType: 'Bolter' }],
      exact: [],
      keySets: [],
    },
  },
  features: {
    quotes: true,
    reorder: true,
    creditDisplay: true,
  },
  logo: { src: '/assets/logo.svg', alt: 'Nordvik Industri' },
  favicon: '/assets/favicon.ico',
};
