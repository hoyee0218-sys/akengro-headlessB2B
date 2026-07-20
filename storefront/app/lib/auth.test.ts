import {describe, expect, it, vi} from 'vitest';
import {
  isDemoLoggedIn,
  logInDemo,
  logOutDemo,
  resolveAuthedUser,
} from './auth';

function mockSession(initial: Record<string, unknown> = {}) {
  const store = {...initial};
  return {
    get: (key: string) => store[key],
    set: (key: string, value: unknown) => {
      store[key] = value;
    },
    unset: (key: string) => {
      delete store[key];
    },
  };
}

describe('auth dual-mode', () => {
  it('mock mode returns demo user when session flag is set', async () => {
    const session = mockSession();
    logInDemo(session);
    expect(isDemoLoggedIn(session)).toBe(true);

    const user = await resolveAuthedUser({
      session,
      customerAccount: {
        isLoggedIn: vi.fn(),
        query: vi.fn(),
        i18n: {language: 'NB'},
      },
      env: {INTEGRATION_MODE: 'mock'},
    });

    expect(user?.customerId).toBe('demo-customer-marius');
    expect(user?.tags).toContain('b2b');
    expect(user?.sparkLayerAuthentication).toBeTruthy();
  });

  it('mock mode returns null when logged out', async () => {
    const session = mockSession();
    logOutDemo(session);
    const user = await resolveAuthedUser({
      session,
      customerAccount: {
        isLoggedIn: vi.fn(),
        query: vi.fn(),
        i18n: {language: 'NB'},
      },
      env: undefined,
    });
    expect(user).toBeNull();
  });

  it('real mode queries Customer Account identity (tags + Spark metafield)', async () => {
    const query = vi.fn().mockResolvedValue({
      data: {
        customer: {
          id: 'gid://shopify/Customer/1',
          tags: ['b2b'],
          emailAddress: {emailAddress: 'buyer@example.com'},
          sparkLayerAuthentication: {value: 'spark-token'},
          sparkLayerPriceLists: {value: '["engros-a"]'},
          sparkLayerCompanyName: {value: 'Buyer AS'},
          companyContacts: {
            nodes: [
              {
                company: {
                  locations: {nodes: [{id: 'gid://shopify/CompanyLocation/9'}]},
                },
              },
            ],
          },
        },
      },
    });

    const user = await resolveAuthedUser({
      session: mockSession(),
      customerAccount: {
        isLoggedIn: vi.fn().mockResolvedValue(true),
        query,
        i18n: {language: 'NB'},
      },
      env: {INTEGRATION_MODE: 'real'},
    });

    expect(query).toHaveBeenCalled();
    expect(user).toEqual({
      customerId: 'gid://shopify/Customer/1',
      email: 'buyer@example.com',
      companyLocationId: 'gid://shopify/CompanyLocation/9',
      tags: ['b2b'],
      sparkLayerAuthentication: 'spark-token',
      priceListIds: ['engros-a'],
      companyName: 'Buyer AS',
    });
  });

  it('real mode returns null when Customer Account says logged out', async () => {
    const user = await resolveAuthedUser({
      session: mockSession({b2bDemoLoggedIn: true}),
      customerAccount: {
        isLoggedIn: vi.fn().mockResolvedValue(false),
        query: vi.fn(),
        i18n: {language: 'NB'},
      },
      env: {INTEGRATION_MODE: 'real'},
    });
    expect(user).toBeNull();
  });

  it('real mode keeps customer when GraphQL has field errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = await resolveAuthedUser({
      session: mockSession(),
      customerAccount: {
        isLoggedIn: vi.fn().mockResolvedValue(true),
        query: vi.fn().mockResolvedValue({
          data: {
            customer: {
              id: 'gid://shopify/Customer/2',
              tags: [],
              emailAddress: {emailAddress: 'retail@example.com'},
              sparkLayerAuthentication: null,
            },
          },
          errors: [{message: 'Access denied for companyContacts'}],
        }),
        i18n: {language: 'NB'},
      },
      env: {INTEGRATION_MODE: 'real'},
    });

    expect(user?.customerId).toBe('gid://shopify/Customer/2');
    expect(user?.tags).toEqual([]);
    warn.mockRestore();
    error.mockRestore();
  });
});
