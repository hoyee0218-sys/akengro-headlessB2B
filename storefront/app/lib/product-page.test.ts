import {describe, expect, it, vi} from 'vitest';
import {getSelectedProductOptions} from '@shopify/hydrogen';
import {getVariantUrl} from '~/lib/variants';
import {
  isOptionValueInStock,
  isOptionValueSelectable,
  overlayPriceWithStorefront,
  productQueryVariables,
  resolvedPriceFromStorefrontVariant,
  variantStockStatus,
} from '~/lib/product-page';
import {loader} from '~/routes/products.$handle';

describe('productQueryVariables', () => {
  it('passes URL option params to the Storefront query', () => {
    const request = new Request(
      'https://example.com/products/demo-handle?Color=Red&Size=Large',
    );

    expect(productQueryVariables('demo-handle', request)).toEqual({
      handle: 'demo-handle',
      selectedOptions: getSelectedProductOptions(request),
    });
    expect(getSelectedProductOptions(request)).toEqual([
      {name: 'Color', value: 'Red'},
      {name: 'Size', value: 'Large'},
    ]);
  });
});

describe('getVariantUrl', () => {
  it('encodes selected options for variant selection links', () => {
    const url = getVariantUrl({
      handle: 'demo-handle',
      pathname: '/products/demo-handle',
      searchParams: new URLSearchParams(),
      selectedOptions: [
        {name: 'Color', value: 'Blue'},
        {name: 'Size', value: 'Small'},
      ],
    });

    expect(url).toBe('/products/demo-handle?Color=Blue&Size=Small');
  });
});

describe('variantStockStatus', () => {
  it('maps Storefront availability to StockIndicator statuses', () => {
    expect(variantStockStatus({availableForSale: true})).toBe('in');
    expect(variantStockStatus({availableForSale: false})).toBe('out');
    expect(variantStockStatus(null)).toBe('out');
  });
});

describe('option value selection vs stock', () => {
  it('keeps existing sold-out sizes selectable (Hydrogen exists semantics)', () => {
    expect(
      isOptionValueSelectable({
        exists: true,
        available: false,
        variant: {availableForSale: false},
      }),
    ).toBe(true);
    expect(isOptionValueSelectable({exists: false, available: false})).toBe(
      false,
    );
  });

  it('treats variant availableForSale as the source of truth for in-stock styling', () => {
    expect(
      isOptionValueInStock({
        exists: true,
        available: false,
        variant: {availableForSale: true},
      }),
    ).toBe(true);
    expect(
      isOptionValueInStock({
        exists: true,
        available: true,
        variant: {availableForSale: false},
      }),
    ).toBe(false);
    expect(
      isOptionValueInStock({
        exists: true,
        available: true,
      }),
    ).toBe(true);
  });
});

describe('resolvedPriceFromStorefrontVariant', () => {
  it('uses variant price and maps compareAtPrice to listAmount when different', () => {
    expect(
      resolvedPriceFromStorefrontVariant({
        price: {amount: '4299.00', currencyCode: 'NOK'},
        compareAtPrice: null,
      }),
    ).toEqual({
      amount: 4299,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
    });

    expect(
      resolvedPriceFromStorefrontVariant({
        price: {amount: '249.00', currencyCode: 'NOK'},
        compareAtPrice: {amount: '299.00', currencyCode: 'NOK'},
      }),
    ).toEqual({
      amount: 249,
      listAmount: 299,
      currency: 'NOK',
      gated: false,
      demo: true,
    });
  });

  it('still surfaces compareAtPrice when it is lower than the selling price', () => {
    // Shopify Admin allows this; template must show the configured compare-at.
    expect(
      resolvedPriceFromStorefrontVariant({
        price: {amount: '31000.0', currencyCode: 'USD'},
        compareAtPrice: {amount: '28699.0', currencyCode: 'USD'},
      }),
    ).toEqual({
      amount: 31000,
      listAmount: 28699,
      currency: 'USD',
      gated: false,
      demo: true,
    });
  });

  it('ignores compareAtPrice equal to the selling price', () => {
    expect(
      resolvedPriceFromStorefrontVariant({
        price: {amount: '100.00', currencyCode: 'NOK'},
        compareAtPrice: {amount: '100.00', currencyCode: 'NOK'},
      })?.listAmount,
    ).toBeNull();
  });

  it('treats compareAtPrice of 0 as unset (Shopify empty compare-at)', () => {
    expect(
      resolvedPriceFromStorefrontVariant({
        price: {amount: '78900.00', currencyCode: 'USD'},
        compareAtPrice: {amount: '0.00', currencyCode: 'USD'},
      }),
    ).toEqual({
      amount: 78900,
      listAmount: null,
      currency: 'USD',
      gated: false,
      demo: true,
    });
  });
});

describe('overlayPriceWithStorefront', () => {
  it('keeps gated seam prices untouched', () => {
    const gated = {
      amount: null,
      listAmount: null,
      currency: 'NOK',
      gated: true,
      demo: true,
    };
    expect(
      overlayPriceWithStorefront(gated, {
        price: {amount: '100.00', currencyCode: 'NOK'},
      }),
    ).toEqual(gated);
  });

  it('fills unmatched seam prices from Storefront Money', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: 'NOK',
          gated: false,
          demo: true,
        },
        {
          price: {amount: '1899.50', currencyCode: 'NOK'},
          compareAtPrice: null,
        },
      ),
    ).toEqual({
      amount: 1899.5,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
  });

  it('applies Spark automatic storefrontMultiplier (−15%) and keeps origin as list', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: 'USD',
          gated: false,
          demo: false,
          storefrontMultiplier: 0.85,
        },
        {
          price: {amount: '78900.00', currencyCode: 'USD'},
          compareAtPrice: null,
        },
      ),
    ).toEqual({
      amount: 67065,
      listAmount: 78900,
      currency: 'USD',
      gated: false,
      demo: false,
      storefrontMultiplier: 0.85,
    });
  });

  it('ignores Admin compare-at 0 when applying −15% Spark multiplier', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: 'USD',
          gated: false,
          demo: false,
          storefrontMultiplier: 0.85,
        },
        {
          price: {amount: '78900.00', currencyCode: 'USD'},
          compareAtPrice: {amount: '0.00', currencyCode: 'USD'},
        },
      ),
    ).toEqual({
      amount: 67065,
      listAmount: 78900,
      currency: 'USD',
      gated: false,
      demo: false,
      storefrontMultiplier: 0.85,
    });
  });

  it('surfaces Storefront compareAtPrice as listAmount when it is a markdown', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: 'USD',
          gated: false,
          demo: true,
        },
        {
          price: {amount: '400.0', currencyCode: 'USD'},
          compareAtPrice: {amount: '499.0', currencyCode: 'USD'},
        },
      ),
    ).toEqual({
      amount: 400,
      listAmount: 499,
      currency: 'USD',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
  });

  it('prefers Storefront compare-at over a seam list when both are markdowns', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: 400,
          listAmount: 450,
          currency: 'USD',
          gated: false,
          demo: true,
        },
        {
          price: {amount: '400.0', currencyCode: 'USD'},
          compareAtPrice: {amount: '499.0', currencyCode: 'USD'},
        },
      ).listAmount,
    ).toBe(499);
  });

  it('keeps fixture-matched seam prices and drops equal listAmount', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: 1248,
          listAmount: 1248,
          currency: 'NOK',
          gated: false,
          demo: true,
        },
        {
          price: {amount: '10.00', currencyCode: 'NOK'},
        },
      ),
    ).toEqual({
      amount: 1248,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
  });

  it('passes through Admin compare-at even when below the selling price', () => {
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: 'USD',
          gated: false,
          demo: true,
        },
        {
          price: {amount: '31000.0', currencyCode: 'USD'},
          compareAtPrice: {amount: '28699.0', currencyCode: 'USD'},
        },
      ),
    ).toEqual({
      amount: 31000,
      listAmount: 28699,
      currency: 'USD',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
  });

  it('preserves storefrontMultiplier so PDP can re-overlay on variant change', () => {
    const first = overlayPriceWithStorefront(
      {
        amount: null,
        listAmount: null,
        currency: 'USD',
        gated: false,
        demo: false,
        storefrontMultiplier: 0.85,
      },
      {
        price: {amount: '78900.00', currencyCode: 'USD'},
        compareAtPrice: {amount: '0.00', currencyCode: 'USD'},
      },
    );
    // Simulate PDP client re-overlay: amount cleared, multiplier kept.
    expect(
      overlayPriceWithStorefront(
        {
          amount: null,
          listAmount: null,
          currency: first.currency,
          gated: false,
          demo: first.demo,
          storefrontMultiplier: first.storefrontMultiplier ?? null,
        },
        {
          price: {amount: '78900.00', currencyCode: 'USD'},
          compareAtPrice: {amount: '0.00', currencyCode: 'USD'},
        },
      ),
    ).toEqual({
      amount: 67065,
      listAmount: 78900,
      currency: 'USD',
      gated: false,
      demo: false,
      storefrontMultiplier: 0.85,
    });
  });
});

describe('products.$handle loader', () => {
  function mockStorefront(
    query: ReturnType<typeof vi.fn>,
  ): {query: typeof query; CacheNone: () => string} {
    return {
      query,
      CacheNone: () => 'no-store',
    };
  }

  it('returns 404 when the product is missing', async () => {
    const storefront = mockStorefront(
      vi.fn().mockResolvedValue({product: null}),
    );

    await expect(
      loader({
        context: {
          env: {},
          session: {get: () => null, set: () => {}, unset: () => {}},
          storefront,
        },
        params: {handle: 'missing-product'},
        request: new Request('https://example.com/products/missing-product'),
      } as never),
    ).rejects.toMatchObject({status: 404});
  });

  it('resolves the selected variant from URL search params', async () => {
    const selectedVariant = {
      id: 'gid://shopify/ProductVariant/2',
      sku: 'SKU-BLUE',
      availableForSale: true,
      selectedOptions: [
        {name: 'Color', value: 'Blue'},
        {name: 'Size', value: 'Large'},
      ],
    };

    const storefront = mockStorefront(
      vi.fn().mockImplementation((_query, {variables}) => {
        expect(variables.selectedOptions).toEqual([
          {name: 'Color', value: 'Blue'},
          {name: 'Size', value: 'Large'},
        ]);

        return Promise.resolve({
          product: {
            id: 'gid://shopify/Product/1',
            handle: 'demo-handle',
            title: 'Demo product',
            selectedOrFirstAvailableVariant: selectedVariant,
          },
        });
      }),
    );

    const result = await loader({
      context: {
        env: {},
        session: {get: () => null, set: () => {}, unset: () => {}},
        storefront,
      },
      params: {handle: 'demo-handle'},
      request: new Request(
        'https://example.com/products/demo-handle?Color=Blue&Size=Large',
      ),
    } as never);

    expect(result.product.selectedOrFirstAvailableVariant).toEqual(selectedVariant);
    expect(result.selectedOptions).toEqual([
      {name: 'Color', value: 'Blue'},
      {name: 'Size', value: 'Large'},
    ]);
    expect(result.loggedIn).toBe(false);
    expect(result.price.gated).toBe(true);
  });

  it('overlays Storefront variant Money when the mock seam has no fixture match', async () => {
    const selectedVariant = {
      id: 'gid://shopify/ProductVariant/2',
      sku: 'Trek-67865-57',
      availableForSale: false,
      price: {amount: '4299.00', currencyCode: 'NOK'},
      compareAtPrice: null,
      selectedOptions: [{name: 'Size', value: '57'}],
    };

    const storefront = mockStorefront(
      vi.fn().mockResolvedValue({
        product: {
          id: 'gid://shopify/Product/1',
          handle: 'trek-emonda',
          title: 'Trek ÉMONDA',
          selectedOrFirstAvailableVariant: selectedVariant,
        },
      }),
    );

    const session = {
      get: (key: string) => (key === 'b2bDemoLoggedIn' ? true : null),
      set: () => {},
      unset: () => {},
    };

    const result = await loader({
      context: {
        env: {INTEGRATION_MODE: 'mock'},
        session,
        storefront,
      },
      params: {handle: 'trek-emonda'},
      request: new Request('https://example.com/products/trek-emonda'),
    } as never);

    expect(result.loggedIn).toBe(true);
    expect(result.price).toEqual({
      amount: 4299,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
    expect(result.breaks).toEqual([]);
  });

  it('maps Storefront compareAtPrice into listAmount on the PDP loader', async () => {
    const selectedVariant = {
      id: 'gid://shopify/ProductVariant/3',
      sku: 'TLD-Skyline-S',
      availableForSale: true,
      price: {amount: '400.0', currencyCode: 'USD'},
      compareAtPrice: {amount: '499.0', currencyCode: 'USD'},
      selectedOptions: [{name: 'Size', value: 'S'}],
    };

    const storefront = mockStorefront(
      vi.fn().mockResolvedValue({
        product: {
          id: 'gid://shopify/Product/2',
          handle: 'troy-lee-designs-skyline',
          title: 'Troy Lee Designs Skyline',
          selectedOrFirstAvailableVariant: selectedVariant,
        },
      }),
    );

    const session = {
      get: (key: string) => (key === 'b2bDemoLoggedIn' ? true : null),
      set: () => {},
      unset: () => {},
    };

    const result = await loader({
      context: {
        env: {INTEGRATION_MODE: 'mock'},
        session,
        storefront,
      },
      params: {handle: 'troy-lee-designs-skyline'},
      request: new Request(
        'https://example.com/products/troy-lee-designs-skyline',
      ),
    } as never);

    expect(result.price).toEqual({
      amount: 400,
      listAmount: 499,
      currency: 'USD',
      gated: false,
      demo: true,
      storefrontMultiplier: null,
    });
  });
});
