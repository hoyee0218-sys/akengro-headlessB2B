import {describe, expect, it} from 'vitest';
import {
  absoluteUrl,
  breadcrumbListJsonLd,
  collectionBreadcrumbJsonLd,
  collectionPageJsonLd,
  organizationJsonLd,
  productBreadcrumbJsonLd,
  productJsonLd,
} from './seo';

describe('seo', () => {
  const origin = 'https://shop.example.com';

  it('builds absolute urls', () => {
    expect(absoluteUrl(origin, '/collections/all')).toBe(
      'https://shop.example.com/collections/all',
    );
    expect(absoluteUrl(origin, 'products/bolt')).toBe(
      'https://shop.example.com/products/bolt',
    );
  });

  it('builds BreadcrumbList JSON-LD for a collection PLP', () => {
    const json = collectionBreadcrumbJsonLd(origin, {
      title: 'All',
      handle: 'all',
    });

    expect(json).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Hjem',
          item: 'https://shop.example.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'All',
          item: 'https://shop.example.com/collections/all',
        },
      ],
    });
  });

  it('builds CollectionPage JSON-LD', () => {
    const json = collectionPageJsonLd(origin, {
      title: 'All',
      handle: 'all',
      description: 'Full catalog',
    });

    expect(json['@type']).toBe('CollectionPage');
    expect(json.url).toBe('https://shop.example.com/collections/all');
    expect(json.name).toBe('All');
  });

  it('supports custom breadcrumb trails', () => {
    const json = breadcrumbListJsonLd(origin, [
      {name: 'Hjem', path: '/'},
      {name: 'Katalog', path: '/collections/all'},
      {name: 'Bolter', path: '/collections/bolter'},
    ]);

    expect((json.itemListElement as unknown[]).length).toBe(3);
  });

  it('builds Organization JSON-LD from merchant identity', () => {
    const json = organizationJsonLd(origin, {
      name: 'Nordvik Industri',
      logoUrl: 'https://shop.example.com/logo.svg',
    });

    expect(json).toMatchObject({
      '@type': 'Organization',
      name: 'Nordvik Industri',
      url: 'https://shop.example.com/',
      logo: 'https://shop.example.com/logo.svg',
    });
  });

  it('builds Product JSON-LD with Offer from Storefront fields', () => {
    const json = productJsonLd(origin, {
      title: 'Sandblåseapparat 100L',
      handle: 'sandblaseapparat-100l-komplett',
      description: 'Komplett apparat',
      vendor: 'Norspray',
      productType: 'Apparat',
      imageUrl: 'https://cdn.shopify.com/image.jpg',
      sku: 'SB-100',
      priceAmount: '12990.00',
      priceCurrency: 'NOK',
      availableForSale: true,
    });

    expect(json['@type']).toBe('Product');
    expect(json.name).toBe('Sandblåseapparat 100L');
    expect(json.url).toBe(
      'https://shop.example.com/products/sandblaseapparat-100l-komplett',
    );
    expect(json.brand).toEqual({'@type': 'Brand', name: 'Norspray'});
    expect(json.offers).toMatchObject({
      '@type': 'Offer',
      price: '12990.00',
      priceCurrency: 'NOK',
      availability: 'https://schema.org/InStock',
    });
  });

  it('builds PDP BreadcrumbList Home → catalog → collection → product', () => {
    const json = productBreadcrumbJsonLd(
      origin,
      {title: 'Bolt M8', handle: 'bolt-m8'},
      {title: 'Bolter', handle: 'bolter'},
    );
    const items = json.itemListElement as Array<{name: string; item: string}>;

    expect(json['@type']).toBe('BreadcrumbList');
    expect(items.map((item) => item.name)).toEqual([
      'Hjem',
      'Katalog',
      'Bolter',
      'Bolt M8',
    ]);
    expect(items[3].item).toContain('/products/bolt-m8?collection=bolter');
  });
});
