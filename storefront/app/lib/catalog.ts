/* ===========================================================================
   ENTITLEMENT + PRICE OVERLAY (BUILD.md §4)
   ---------------------------------------------------------------------------
   Catalog *content/SEO* comes from Shopify (the CatalogProvider); *visibility +
   price* is a server-side entitlement overlay on top. This is the single
   well-named function the PLP/PDP loaders call, so swapping mock→real is ONE
   change. Runs server-side only.

   The product list itself can be filtered/augmented by entitlements here (a B2B
   customer may only see SKUs their price list grants) — for the demo every
   product is visible; the hook is marked below.
   ======================================================================== */
import {getPriceForCustomerSafe, getSeams, type SeamEnv} from './seams';
import type {CatalogProduct, CustomerContext, ResolvedPrice} from './seams/types';

export interface PricedProduct extends CatalogProduct {
  price: ResolvedPrice;
}

async function overlayPrice(
  env: SeamEnv,
  product: CatalogProduct,
  ctx: CustomerContext | null,
): Promise<PricedProduct> {
  const seams = getSeams(env);
  const price = await getPriceForCustomerSafe(seams, product.id, ctx);
  return {...product, price};
}

export async function getPricedProducts(
  env: SeamEnv,
  ctx: CustomerContext | null,
  filter?: {category?: string | null},
): Promise<PricedProduct[]> {
  const seams = getSeams(env);
  let products = await seams.catalog.getProducts(ctx);

  // Entitlement-scoped visibility hook (BUILD.md §4): in production the
  // EntitlementProvider can restrict which SKUs/collections are visible.
  // Demo: all products visible.

  if (filter?.category) {
    products = products.filter((p) => p.cat === filter.category);
  }

  return Promise.all(products.map((p) => overlayPrice(env, p, ctx)));
}

export async function getPricedProduct(
  env: SeamEnv,
  id: string,
  ctx: CustomerContext | null,
): Promise<PricedProduct | null> {
  const seams = getSeams(env);
  const product = await seams.catalog.getProduct(id, ctx);
  if (!product) return null;
  return overlayPrice(env, product, ctx);
}
