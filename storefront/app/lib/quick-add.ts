/* Quick-add product payload for the PLP modal (variants + prices). */
import {
  overlayPriceWithStorefront,
  type StorefrontPricedVariant,
} from '~/lib/product-page';
import {variantStockStatus} from '~/lib/product-stock';
import type {CustomerContext, ResolvedPrice, Seams} from '~/lib/seams/types';
import {getPriceForCustomerSafe} from '~/lib/seams';
import type {StockStatus} from '~/components/ds/StockIndicator';

export type QuickAddOptionValue = {
  name: string;
  availableForSale: boolean;
};

export type QuickAddOption = {
  name: string;
  values: QuickAddOptionValue[];
};

export type QuickAddVariant = {
  id: string;
  sku: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
  imageUrl: string | null;
  price: ResolvedPrice;
  stock: StockStatus;
};

export type QuickAddProduct = {
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  imageUrl: string | null;
  options: QuickAddOption[];
  variants: QuickAddVariant[];
  defaultVariantId: string | null;
};

type StorefrontMoney = {
  amount: string;
  currencyCode: string;
} | null | undefined;

type RawVariant = {
  id: string;
  sku?: string | null;
  title?: string | null;
  availableForSale?: boolean | null;
  selectedOptions?: Array<{name: string; value: string}> | null;
  image?: {url?: string | null} | null;
  price?: StorefrontMoney;
  compareAtPrice?: StorefrontMoney;
};

type RawProduct = {
  handle: string;
  title: string;
  vendor?: string | null;
  productType?: string | null;
  featuredImage?: {url?: string | null} | null;
  options?: Array<{
    name: string;
    optionValues?: Array<{name: string}> | null;
  }> | null;
  variants?: {nodes?: RawVariant[] | null} | null;
  selectedOrFirstAvailableVariant?: RawVariant | null;
};

/** Build a cart-friendly productId for a variant (SKU preferred). */
export function quickAddCartId(
  product: Pick<QuickAddProduct, 'handle'>,
  variant: Pick<QuickAddVariant, 'sku'> | null,
): string {
  return variant?.sku || product.handle;
}

/** Resolve the variant matching the current option selection. */
export function findQuickAddVariant(
  variants: QuickAddVariant[],
  selected: Record<string, string>,
): QuickAddVariant | null {
  if (variants.length === 0) return null;
  const match = variants.find((variant) =>
    variant.selectedOptions.every(
      (option) => selected[option.name] === option.value,
    ),
  );
  return match ?? null;
}

/** Whether an option value exists for the other currently selected options. */
export function isQuickAddOptionAvailable(
  variants: QuickAddVariant[],
  optionName: string,
  optionValue: string,
  selected: Record<string, string>,
): boolean {
  return variants.some((variant) => {
    const hasValue = variant.selectedOptions.some(
      (option) => option.name === optionName && option.value === optionValue,
    );
    if (!hasValue) return false;
    return variant.selectedOptions.every((option) => {
      if (option.name === optionName) return true;
      const current = selected[option.name];
      return !current || current === option.value;
    });
  });
}

export async function loadQuickAddProduct(
  // Hydrogen Storefront client — typed loosely so callers don't fight codegen generics.
  storefront: {
    query: (query: string, options?: Record<string, unknown>) => Promise<any>;
    CacheNone: () => unknown;
  },
  seams: Seams,
  ctx: CustomerContext | null,
  handle: string,
): Promise<QuickAddProduct | null> {
  const {product} = (await storefront.query(QUICK_ADD_PRODUCT_QUERY, {
    variables: {handle},
    cache: storefront.CacheNone(),
  })) as {product: RawProduct | null};

  if (!product?.handle) return null;

  const rawVariants = product.variants?.nodes ?? [];
  const variants: QuickAddVariant[] = await Promise.all(
    rawVariants.map(async (variant) => {
      const pricingKey = variant.sku || product.handle;
      const seamPrice = await getPriceForCustomerSafe(seams, pricingKey, ctx);
      const priced = overlayPriceWithStorefront(
        seamPrice,
        variant as StorefrontPricedVariant,
      );
      return {
        id: variant.id,
        sku: variant.sku || product.handle,
        title: variant.title || product.title,
        availableForSale: Boolean(variant.availableForSale),
        selectedOptions: variant.selectedOptions ?? [],
        imageUrl: variant.image?.url ?? product.featuredImage?.url ?? null,
        price: priced,
        stock: variantStockStatus(variant),
      };
    }),
  );

  const options: QuickAddOption[] =
    product.options?.map((option) => ({
      name: option.name,
      values: (option.optionValues ?? []).map((value) => {
        const anyInStock = variants.some(
          (variant) =>
            variant.availableForSale &&
            variant.selectedOptions.some(
              (selected) =>
                selected.name === option.name && selected.value === value.name,
            ),
        );
        return {name: value.name, availableForSale: anyInStock};
      }),
    })) ?? [];

  const defaultVariant =
    variants.find(
      (variant) => variant.id === product.selectedOrFirstAvailableVariant?.id,
    ) ??
    variants.find((variant) => variant.availableForSale) ??
    variants[0] ??
    null;

  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor ?? '',
    productType: product.productType ?? '',
    imageUrl:
      defaultVariant?.imageUrl ?? product.featuredImage?.url ?? null,
    options,
    variants,
    defaultVariantId: defaultVariant?.id ?? null,
  };
}

export const QUICK_ADD_PRODUCT_QUERY = `#graphql
  query QuickAddProduct(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
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
      options {
        name
        optionValues {
          name
        }
      }
      variants(first: 100) {
        nodes {
          id
          sku
          title
          availableForSale
          selectedOptions {
            name
            value
          }
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
      selectedOrFirstAvailableVariant(
        selectedOptions: []
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        id
        sku
        availableForSale
      }
    }
  }
` as const;
