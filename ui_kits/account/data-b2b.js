/* Extra B2B mock data layer for the account kit (DEMO DATA, §7 seams).
   Loaded after storefront/data.js; extends window.DEMO in place. */
(function () {
  const D = window.DEMO;
  const P = D.products;
  const find = (sku) => P.find(p => p.sku === sku) || P[0];

  /* --- Reorder history: aggregated from order lines, ranked by frequency ---
     In production this comes from AccountDataProvider.getOrderHistory (§7). */
  D.reorderHistory = [
    { sku: 'CLP-022-ZN', times: 14, lastOrdered: '04.06.2026', lastQty: 100, lastPrice: 34 },
    { sku: 'VLV-8830-SS', times: 11, lastOrdered: '04.06.2026', lastQty: 12, lastPrice: 1186 },
    { sku: 'FLG-2210-CS', times: 9, lastOrdered: '28.05.2026', lastQty: 50, lastPrice: 58 },
    { sku: 'VLV-8831-BR', times: 7, lastOrdered: '21.05.2026', lastQty: 24, lastPrice: 452 },
    { sku: 'FIT-4501-SS', times: 6, lastOrdered: '09.05.2026', lastQty: 20, lastPrice: 198 },
    { sku: 'FLG-2280-PT', times: 4, lastOrdered: '02.05.2026', lastQty: 10, lastPrice: 296 },
  ].map(r => ({ ...r, product: find(r.sku) }));

  /* --- Saved lists / order templates (feature 2) + recurring schedule (7) --- */
  D.savedLists = [
    {
      id: 'list-serviceuke', name: 'Serviceuke – standardpakke', schedule: 'Hver 4. uke',
      nextRun: '01.07.2026', owner: 'Marius Hansen',
      items: [
        { sku: 'CLP-022-ZN', qty: 100 }, { sku: 'FLG-2210-CS', qty: 50 },
        { sku: 'VLV-8831-BR', qty: 24 }, { sku: 'FIT-4501-SS', qty: 20 },
      ],
    },
    {
      id: 'list-prosjekt-strand', name: 'Prosjekt Strand', schedule: null,
      nextRun: null, owner: 'Ingrid Solberg',
      items: [
        { sku: 'VLV-9120-CI', qty: 6 }, { sku: 'FLG-2280-PT', qty: 10 }, { sku: 'VLV-8830-SS', qty: 12 },
      ],
    },
    {
      id: 'list-lager', name: 'Lager påfyll', schedule: 'Hver uke',
      nextRun: '13.06.2026', owner: 'Marius Hansen',
      items: [
        { sku: 'CLP-022-ZN', qty: 500 }, { sku: 'CLP-035-RB', qty: 100 },
      ],
    },
  ].map(l => ({
    ...l,
    lines: l.items.map(it => ({ ...it, product: find(it.sku) })),
    total: l.items.reduce((s, it) => s + find(it.sku).amount * it.qty, 0),
  }));

  /* --- Company users + roles + approval (feature 4) --- */
  D.users = [
    { id: 'u1', name: 'Marius Hansen', email: 'marius@bergenror.no', role: 'Administrator', limit: null, status: 'active', initials: 'MH' },
    { id: 'u2', name: 'Ingrid Solberg', email: 'ingrid@bergenror.no', role: 'Innkjøper', limit: 50000, status: 'active', initials: 'IS' },
    { id: 'u3', name: 'Ola Nordmann', email: 'ola@bergenror.no', role: 'Bestiller', limit: 15000, status: 'active', initials: 'ON' },
    { id: 'u4', name: 'Kari Vik', email: 'kari@bergenror.no', role: 'Bestiller', limit: 15000, status: 'invited', initials: 'KV' },
  ];
  D.roles = {
    Administrator: 'Full tilgang · brukere · godkjenning',
    'Innkjøper': 'Bestiller fritt · godkjenner under grense',
    Bestiller: 'Oppretter ordre · krever godkjenning',
  };

  /* --- Approvals queue (orders awaiting sign-off) (feature 4) --- */
  D.approvals = [
    { id: 'APR-3081', by: 'Ola Nordmann', date: '06.06.2026', lines: 4, total: 21840, ref: 'Prosjekt Strand', note: 'Haster – mangler på lager' },
    { id: 'APR-3079', by: 'Kari Vik', date: '05.06.2026', lines: 2, total: 11200, ref: '', note: '' },
  ];

  /* --- Ship-to addresses (feature 5) --- */
  D.shipTo = [
    { id: 'addr-hq', label: 'Hovedlager', line: 'Kanalveien 12, 5068 Bergen', def: true },
    { id: 'addr-strand', label: 'Prosjekt Strand', line: 'Strandgaten 200, 5004 Bergen', def: false },
    { id: 'addr-osl', label: 'Avd. Oslo', line: 'Brobekkveien 80, 0582 Oslo', def: false },
  ];
  D.costCenters = ['Drift', 'Prosjekt Strand', 'Prosjekt Nordvik', 'Vedlikehold', 'Lager'];

  /* --- Notifications / back-in-stock subscriptions (feature 6) --- */
  D.notifications = [
    { id: 'n1', type: 'back-in-stock', sku: 'CLP-035-RB', date: 'i dag 08:14', read: false, text: 'tilbake på lager' },
    { id: 'n2', type: 'order', ref: 'NO-104882', date: 'i går', read: false, text: 'er sendt' },
    { id: 'n3', type: 'approval', ref: 'APR-3081', date: 'i går', read: false, text: 'venter på din godkjenning' },
    { id: 'n4', type: 'invoice', ref: 'F-NO-104790', date: '2 dager siden', read: true, text: 'er forfalt' },
    { id: 'n5', type: 'quote', ref: 'TIL-2041', date: '4 dager siden', read: true, text: 'er klart' },
  ].map(n => ({ ...n, product: n.sku ? find(n.sku) : null }));

  D.backInStockWatch = [
    { sku: 'CLP-035-RB', since: '02.06.2026' },
    { sku: 'VLV-9120-CI', since: '05.06.2026' },
  ].map(w => ({ ...w, product: find(w.sku) }));

  /* --- Quote line detail for quote→order conversion (feature 8) --- */
  D.quoteLines = {
    'TIL-2041': [
      { sku: 'VLV-9120-CI', qty: 6, price: 3320 }, { sku: 'FLG-2280-PT', qty: 10, price: 296 },
      { sku: 'VLV-8830-SS', qty: 24, price: 1098 }, { sku: 'FIT-4501-SS', qty: 20, price: 182 },
      { sku: 'FLG-2210-CS', qty: 50, price: 51 }, { sku: 'CLP-022-ZN', qty: 200, price: 29 },
    ],
    'TIL-2033': [
      { sku: 'VLV-8831-BR', qty: 24, price: 452 }, { sku: 'CLP-022-ZN', qty: 100, price: 34 },
      { sku: 'FLG-2210-CS', qty: 50, price: 58 },
    ],
  };
  Object.keys(D.quoteLines).forEach(k => {
    D.quoteLines[k] = D.quoteLines[k].map(l => ({ ...l, product: find(l.sku) }));
  });
})();
