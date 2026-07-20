/* ===========================================================================
   INTEGRATION SEAMS — typed contracts (BUILD.md §5)
   ---------------------------------------------------------------------------
   These interfaces are the boundary between what WE own (storefront UI, the
   "Mine sider" account experience, the auth→entitlement bridge) and what we
   CONSUME but never reimplement:
     • PricingProvider     ← SparkLayer price lists, fed by the ERP→Spark sync
     • EntitlementProvider ← Shopify identity → B2B context  (THE bridge, §6)
     • OrderProvider       ← Shopify Admin/Orders API + SparkLayer order sync
     • AccountDataProvider ← SparkLayer / Shopify order & quote data
     • CatalogProvider     ← Shopify Storefront API collection content/SEO

   Each provider has a MockProvider (realistic demo data → DemoDataBadge) and a
   RealProvider (throws NotImplemented naming the owner). Selected by env
   INTEGRATION_MODE=mock|real. ALL providers are called from loaders/actions
   only — never from client identity (the hard authz boundary, §6).
   ======================================================================== */

export type IntegrationMode = 'mock' | 'real';

/* ---- Identity & entitlement ---------------------------------------------- */

/** The authenticated Shopify customer as seen by the Customer Account API.
 *  In real mode this is derived from the Customer Account session; the bridge
 *  never trusts client-supplied identity for price/order access. */
export interface ShopifyAuthedUser {
  customerId: string;
  email?: string;
  /** B2B company location id from the Customer Account API, when present. */
  companyLocationId?: string | null;
  /** Customer tags (e.g. `b2b`) from Customer Account API. */
  tags?: string[];
  /**
   * SparkLayer auth handshake metafield (`sparklayer.authentication`).
   * Required for real Spark JS init — only present when Admin exposes it.
   */
  sparkLayerAuthentication?: string | null;
  /**
   * Price-list slugs from `sparklayer.price_lists` (priority / cascade order).
   * Used by real pricing to filter Spark REST responses — never trust client.
   */
  priceListIds?: string[];
  /** Optional company display name from `sparklayer.company_name`. */
  companyName?: string | null;
}

/** Result of the entitlement bridge — the single resolution path that every
 *  merchant fork inherits (BUILD.md §6). */
export interface Entitlements {
  companyId: string;
  priceListIds: string[];
  permissions: Permission[];
}

export type Permission =
  | 'order:create'
  | 'order:view'
  | 'quote:request'
  | 'quote:convert'
  | 'approval:manage'
  | 'users:manage'
  | 'credit:view';

/** The B2B context threaded into every server-side price/order/quote read. */
export interface CustomerContext {
  customerId: string;
  email?: string;
  companyId: string;
  companyName: string;
  orgnr: string;
  priceListIds: string[];
  priceListLabel: string;
  terms: string;
  permissions: Permission[];
  credit: {limit: number; used: number};
  /** Always true for values that came from a Mock provider — drives DemoDataBadge. */
  demo: boolean;
}

/* ---- Pricing ------------------------------------------------------------- */

export interface PriceBreak {
  minQty: number;
  price: number;
}

export interface ResolvedPrice {
  /** Entitlement-resolved net price for this customer, or null when gated. */
  amount: number | null;
  /** List/reference price for comparison (struck through in the UI). */
  listAmount: number | null;
  currency: string;
  /** True when the visitor is not entitled to see a price (logged out / no list). */
  gated: boolean;
  demo: boolean;
  /**
   * When `amount` is null, overlay multiplies Storefront Money by this factor
   * (automatic Spark lists that have no materialized SKU rows yet).
   */
  storefrontMultiplier?: number | null;
}

export interface PricingProvider {
  getPriceForCustomer(
    productId: string,
    ctx: CustomerContext | null,
  ): Promise<ResolvedPrice>;
  getQuantityBreaks(
    variantId: string,
    ctx: CustomerContext | null,
  ): Promise<PriceBreak[]>;
}

export interface EntitlementProvider {
  resolveEntitlements(user: ShopifyAuthedUser): Promise<Entitlements>;
}

/* ---- Catalog (content/SEO from Shopify; price is a separate overlay) ----- */

export type StockStatus = 'in' | 'low' | 'out' | 'backorder';

export interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  cat: string;
  /** List price used only when no entitlement price applies / for comparison. */
  amount: number;
  listAmount: number;
  stock: StockStatus;
  lead: string;
  material: string;
  breaks: PriceBreak[];
}

export interface CatalogProvider {
  getProducts(ctx: CustomerContext | null): Promise<CatalogProduct[]>;
  getProduct(id: string, ctx: CustomerContext | null): Promise<CatalogProduct | null>;
  getCategories(ctx: CustomerContext | null): Promise<string[]>;
}

/* ---- Orders / checkout handoff ------------------------------------------- */

export interface CartLineInput {
  productId: string;
  sku: string;
  qty: number;
  price: number;
}

export interface CartInput {
  lines: CartLineInput[];
  poNumber?: string;
  costCenter?: string;
  shipToId?: string;
  paymentMethod?: 'invoice' | 'card';
  note?: string;
}

export interface CreatedOrder {
  platformOrderId: string;
  sparkCartId: string;
  demo: boolean;
}

export interface OrderProvider {
  createOrder(cart: CartInput, ctx: CustomerContext): Promise<CreatedOrder>;
  syncOrderToSparkLayer(order: CreatedOrder): Promise<void>;
}

/* ---- Account data ("Mine sider") ----------------------------------------- */

export interface OrderSummary {
  id: string;
  date: string;
  status: string;
  lines: number;
  total: number;
  ref: string;
}

export interface QuoteSummary {
  id: string;
  date: string;
  status: string;
  lines: number;
  total: number;
  valid: string;
}

export interface QuoteLine {
  sku: string;
  qty: number;
  price: number;
  product: CatalogProduct;
}

export interface ReorderItem {
  sku: string;
  times: number;
  lastOrdered: string;
  lastQty: number;
  lastPrice: number;
  product: CatalogProduct;
}

export interface SavedListLine {
  sku: string;
  qty: number;
  product: CatalogProduct;
}

export interface SavedList {
  id: string;
  name: string;
  schedule: string | null;
  nextRun: string | null;
  owner: string;
  items: {sku: string; qty: number}[];
  lines: SavedListLine[];
  total: number;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  limit: number | null;
  status: 'active' | 'invited';
  initials: string;
}

export interface Approval {
  id: string;
  by: string;
  date: string;
  lines: number;
  total: number;
  ref: string;
  note: string;
}

export interface ShipToAddress {
  id: string;
  label: string;
  line: string;
  def: boolean;
}

export interface AppNotification {
  id: string;
  type: 'back-in-stock' | 'order' | 'approval' | 'invoice' | 'quote';
  sku?: string;
  ref?: string;
  date: string;
  read: boolean;
  text: string;
  product: CatalogProduct | null;
}

export interface StockWatch {
  sku: string;
  since: string;
  product: CatalogProduct;
}

export interface Credit {
  limit: number;
  used: number;
}

export interface AccountDataProvider {
  getOrderHistory(ctx: CustomerContext): Promise<OrderSummary[]>;
  getOrder(id: string, ctx: CustomerContext): Promise<OrderSummary | null>;
  getQuotes(ctx: CustomerContext): Promise<QuoteSummary[]>;
  getQuote(id: string, ctx: CustomerContext): Promise<QuoteSummary | null>;
  getQuoteLines(id: string, ctx: CustomerContext): Promise<QuoteLine[]>;
  getCredit(ctx: CustomerContext): Promise<Credit>;
  getReorderHistory(ctx: CustomerContext): Promise<ReorderItem[]>;
  getSavedLists(ctx: CustomerContext): Promise<SavedList[]>;
  getUsers(ctx: CustomerContext): Promise<CompanyUser[]>;
  getRoles(ctx: CustomerContext): Promise<Record<string, string>>;
  getApprovals(ctx: CustomerContext): Promise<Approval[]>;
  getNotifications(ctx: CustomerContext): Promise<AppNotification[]>;
  getStockWatch(ctx: CustomerContext): Promise<StockWatch[]>;
  getShipToAddresses(ctx: CustomerContext): Promise<ShipToAddress[]>;
  getCostCenters(ctx: CustomerContext): Promise<string[]>;
}

/* ---- The full seam set, selected per request ----------------------------- */

export interface Seams {
  mode: IntegrationMode;
  pricing: PricingProvider;
  entitlement: EntitlementProvider;
  catalog: CatalogProvider;
  order: OrderProvider;
  account: AccountDataProvider;
}
