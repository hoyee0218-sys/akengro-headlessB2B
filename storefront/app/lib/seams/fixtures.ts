/* ===========================================================================
   DEMO FIXTURES (BUILD.md §5/§6 fixture contract)
   ---------------------------------------------------------------------------
   Ported verbatim from the design-system kits:
     ui_kits/storefront/data.js  +  ui_kits/account/data-b2b.js
   This is the shape the Mock providers serve and the contract the Real
   providers must satisfy. Industrial wholesale (VVS — valves & fittings).
   Every value here is DEMO DATA → rendered with a DemoDataBadge.
   ======================================================================== */
import type {
  Approval,
  AppNotification,
  CatalogProduct,
  CompanyUser,
  OrderSummary,
  QuoteLine,
  QuoteSummary,
  ReorderItem,
  SavedList,
  ShipToAddress,
  StockWatch,
} from './types';

export const products: CatalogProduct[] = [
  {id: 'vlv-8830', sku: 'VLV-8830-SS', title: 'Kuleventil DN25 rustfritt stål', cat: 'Ventiler', amount: 1248, listAmount: 1390, stock: 'in', lead: 'sendes i dag', material: 'Rustfritt stål 316', breaks: [{minQty: 1, price: 1248}, {minQty: 12, price: 1186}, {minQty: 48, price: 1098}]},
  {id: 'vlv-8831', sku: 'VLV-8831-BR', title: 'Kuleventil DN20 messing', cat: 'Ventiler', amount: 489, listAmount: 559, stock: 'in', lead: 'sendes i dag', material: 'Messing CW617N', breaks: [{minQty: 1, price: 489}, {minQty: 24, price: 452}, {minQty: 96, price: 419}]},
  {id: 'flg-2210', sku: 'FLG-2210-CS', title: 'Flensepakning EPDM DN50', cat: 'Pakninger', amount: 64, listAmount: 78, stock: 'low', lead: '2–3 virkedager', material: 'EPDM 70 Shore', breaks: [{minQty: 1, price: 64}, {minQty: 50, price: 58}, {minQty: 250, price: 51}]},
  {id: 'clp-022', sku: 'CLP-022-ZN', title: 'Rørklemme 22 mm galvanisert', cat: 'Klemmer', amount: 39, listAmount: 45, stock: 'in', lead: 'sendes i dag', material: 'Galvanisert stål', breaks: [{minQty: 1, price: 39}, {minQty: 100, price: 34}, {minQty: 500, price: 29}]},
  {id: 'fit-4501', sku: 'FIT-4501-SS', title: 'Albue 90° DN32 rustfritt', cat: 'Rørdeler', amount: 212, listAmount: 240, stock: 'in', lead: 'sendes i dag', material: 'Rustfritt stål 316L', breaks: [{minQty: 1, price: 212}, {minQty: 20, price: 198}, {minQty: 80, price: 182}]},
  {id: 'vlv-9120', sku: 'VLV-9120-CI', title: 'Sluseventil DN80 støpejern', cat: 'Ventiler', amount: 3540, listAmount: 3980, stock: 'backorder', lead: '3–5 virkedager', material: 'Støpejern GG25', breaks: [{minQty: 1, price: 3540}, {minQty: 6, price: 3320}, {minQty: 24, price: 3090}]},
  {id: 'flg-2280', sku: 'FLG-2280-PT', title: 'Blindflens DN65 PN16', cat: 'Flenser', amount: 318, listAmount: 360, stock: 'in', lead: 'sendes i dag', material: 'P250GH stål', breaks: [{minQty: 1, price: 318}, {minQty: 10, price: 296}, {minQty: 40, price: 272}]},
  {id: 'clp-035', sku: 'CLP-035-RB', title: 'Gummiisolert rørklemme 35 mm', cat: 'Klemmer', amount: 58, listAmount: 66, stock: 'out', lead: 'forventet 12.06', material: 'Stål + EPDM', breaks: [{minQty: 1, price: 58}, {minQty: 100, price: 52}, {minQty: 500, price: 46}]},
];

export const categories = ['Ventiler', 'Pakninger', 'Klemmer', 'Rørdeler', 'Flenser'];

export const orders: OrderSummary[] = [
  {id: 'NO-104882', date: '04.06.2026', status: 'shipped', lines: 3, total: 18420, ref: 'Prosjekt Nordvik'},
  {id: 'NO-104871', date: '28.05.2026', status: 'delivered', lines: 7, total: 42980, ref: 'Lager påfyll'},
  {id: 'NO-104844', date: '21.05.2026', status: 'invoiced', lines: 2, total: 6360, ref: ''},
  {id: 'NO-104790', date: '09.05.2026', status: 'overdue', lines: 5, total: 28140, ref: 'Prosjekt Strand'},
  {id: 'NO-104755', date: '02.05.2026', status: 'delivered', lines: 4, total: 15280, ref: ''},
];

export const quotes: QuoteSummary[] = [
  {id: 'TIL-2041', date: '03.06.2026', status: 'quote', lines: 6, total: 64200, valid: '17.06.2026'},
  {id: 'TIL-2033', date: '27.05.2026', status: 'confirmed', lines: 3, total: 11900, valid: '—'},
];

export const company = {
  name: 'Bergen Rør & VVS AS',
  orgnr: '912 345 678',
  terms: 'Netto 30',
  priceList: 'Engros A',
  credit: {limit: 250000, used: 96540},
};

const find = (sku: string): CatalogProduct =>
  products.find((p) => p.sku === sku) || products[0];

export const reorderHistory: ReorderItem[] = [
  {sku: 'CLP-022-ZN', times: 14, lastOrdered: '04.06.2026', lastQty: 100, lastPrice: 34},
  {sku: 'VLV-8830-SS', times: 11, lastOrdered: '04.06.2026', lastQty: 12, lastPrice: 1186},
  {sku: 'FLG-2210-CS', times: 9, lastOrdered: '28.05.2026', lastQty: 50, lastPrice: 58},
  {sku: 'VLV-8831-BR', times: 7, lastOrdered: '21.05.2026', lastQty: 24, lastPrice: 452},
  {sku: 'FIT-4501-SS', times: 6, lastOrdered: '09.05.2026', lastQty: 20, lastPrice: 198},
  {sku: 'FLG-2280-PT', times: 4, lastOrdered: '02.05.2026', lastQty: 10, lastPrice: 296},
].map((r) => ({...r, product: find(r.sku)}));

export const savedLists: SavedList[] = [
  {id: 'list-serviceuke', name: 'Serviceuke – standardpakke', schedule: 'Hver 4. uke', nextRun: '01.07.2026', owner: 'Marius Hansen', items: [{sku: 'CLP-022-ZN', qty: 100}, {sku: 'FLG-2210-CS', qty: 50}, {sku: 'VLV-8831-BR', qty: 24}, {sku: 'FIT-4501-SS', qty: 20}]},
  {id: 'list-prosjekt-strand', name: 'Prosjekt Strand', schedule: null, nextRun: null, owner: 'Ingrid Solberg', items: [{sku: 'VLV-9120-CI', qty: 6}, {sku: 'FLG-2280-PT', qty: 10}, {sku: 'VLV-8830-SS', qty: 12}]},
  {id: 'list-lager', name: 'Lager påfyll', schedule: 'Hver uke', nextRun: '13.06.2026', owner: 'Marius Hansen', items: [{sku: 'CLP-022-ZN', qty: 500}, {sku: 'CLP-035-RB', qty: 100}]},
].map((l) => ({
  ...l,
  lines: l.items.map((it) => ({...it, product: find(it.sku)})),
  total: l.items.reduce((s, it) => s + find(it.sku).amount * it.qty, 0),
}));

export const users: CompanyUser[] = [
  {id: 'u1', name: 'Marius Hansen', email: 'marius@bergenror.no', role: 'Administrator', limit: null, status: 'active', initials: 'MH'},
  {id: 'u2', name: 'Ingrid Solberg', email: 'ingrid@bergenror.no', role: 'Innkjøper', limit: 50000, status: 'active', initials: 'IS'},
  {id: 'u3', name: 'Ola Nordmann', email: 'ola@bergenror.no', role: 'Bestiller', limit: 15000, status: 'active', initials: 'ON'},
  {id: 'u4', name: 'Kari Vik', email: 'kari@bergenror.no', role: 'Bestiller', limit: 15000, status: 'invited', initials: 'KV'},
];

export const roles: Record<string, string> = {
  Administrator: 'Full tilgang · brukere · godkjenning',
  Innkjøper: 'Bestiller fritt · godkjenner under grense',
  Bestiller: 'Oppretter ordre · krever godkjenning',
};

export const approvals: Approval[] = [
  {id: 'APR-3081', by: 'Ola Nordmann', date: '06.06.2026', lines: 4, total: 21840, ref: 'Prosjekt Strand', note: 'Haster – mangler på lager'},
  {id: 'APR-3079', by: 'Kari Vik', date: '05.06.2026', lines: 2, total: 11200, ref: '', note: ''},
];

export const shipTo: ShipToAddress[] = [
  {id: 'addr-hq', label: 'Hovedlager', line: 'Kanalveien 12, 5068 Bergen', def: true},
  {id: 'addr-strand', label: 'Prosjekt Strand', line: 'Strandgaten 200, 5004 Bergen', def: false},
  {id: 'addr-osl', label: 'Avd. Oslo', line: 'Brobekkveien 80, 0582 Oslo', def: false},
];

export const costCenters = ['Drift', 'Prosjekt Strand', 'Prosjekt Nordvik', 'Vedlikehold', 'Lager'];

export const notifications: AppNotification[] = [
  {id: 'n1', type: 'back-in-stock', sku: 'CLP-035-RB', date: 'i dag 08:14', read: false, text: 'tilbake på lager'},
  {id: 'n2', type: 'order', ref: 'NO-104882', date: 'i går', read: false, text: 'er sendt'},
  {id: 'n3', type: 'approval', ref: 'APR-3081', date: 'i går', read: false, text: 'venter på din godkjenning'},
  {id: 'n4', type: 'invoice', ref: 'F-NO-104790', date: '2 dager siden', read: true, text: 'er forfalt'},
  {id: 'n5', type: 'quote', ref: 'TIL-2041', date: '4 dager siden', read: true, text: 'er klart'},
].map((n) => ({...n, product: n.sku ? find(n.sku) : null})) as AppNotification[];

export const backInStockWatch: StockWatch[] = [
  {sku: 'CLP-035-RB', since: '02.06.2026'},
  {sku: 'VLV-9120-CI', since: '05.06.2026'},
].map((w) => ({...w, product: find(w.sku)}));

const rawQuoteLines: Record<string, {sku: string; qty: number; price: number}[]> = {
  'TIL-2041': [
    {sku: 'VLV-9120-CI', qty: 6, price: 3320}, {sku: 'FLG-2280-PT', qty: 10, price: 296},
    {sku: 'VLV-8830-SS', qty: 24, price: 1098}, {sku: 'FIT-4501-SS', qty: 20, price: 182},
    {sku: 'FLG-2210-CS', qty: 50, price: 51}, {sku: 'CLP-022-ZN', qty: 200, price: 29},
  ],
  'TIL-2033': [
    {sku: 'VLV-8831-BR', qty: 24, price: 452}, {sku: 'CLP-022-ZN', qty: 100, price: 34},
    {sku: 'FLG-2210-CS', qty: 50, price: 58},
  ],
};

export const quoteLines: Record<string, QuoteLine[]> = Object.fromEntries(
  Object.entries(rawQuoteLines).map(([k, lines]) => [
    k,
    lines.map((l) => ({...l, product: find(l.sku)})),
  ]),
);

export const findProduct = find;
