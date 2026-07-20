/* Mock catalog data for the storefront demo (industrial wholesale — VVS/valves
   & fittings). All values are DEMO DATA fed through the seam mock layer (§7). */
window.DEMO = (function () {
  const products = [
    { id: 'vlv-8830', sku: 'VLV-8830-SS', title: 'Kuleventil DN25 rustfritt stål', cat: 'Ventiler',
      amount: 1248, listAmount: 1390, stock: 'in', lead: 'sendes i dag', material: 'Rustfritt stål 316',
      breaks: [{minQty:1,price:1248},{minQty:12,price:1186},{minQty:48,price:1098}] },
    { id: 'vlv-8831', sku: 'VLV-8831-BR', title: 'Kuleventil DN20 messing', cat: 'Ventiler',
      amount: 489, listAmount: 559, stock: 'in', lead: 'sendes i dag', material: 'Messing CW617N',
      breaks: [{minQty:1,price:489},{minQty:24,price:452},{minQty:96,price:419}] },
    { id: 'flg-2210', sku: 'FLG-2210-CS', title: 'Flensepakning EPDM DN50', cat: 'Pakninger',
      amount: 64, listAmount: 78, stock: 'low', lead: '2–3 virkedager', material: 'EPDM 70 Shore',
      breaks: [{minQty:1,price:64},{minQty:50,price:58},{minQty:250,price:51}] },
    { id: 'clp-022', sku: 'CLP-022-ZN', title: 'Rørklemme 22 mm galvanisert', cat: 'Klemmer',
      amount: 39, listAmount: 45, stock: 'in', lead: 'sendes i dag', material: 'Galvanisert stål',
      breaks: [{minQty:1,price:39},{minQty:100,price:34},{minQty:500,price:29}] },
    { id: 'fit-4501', sku: 'FIT-4501-SS', title: 'Albue 90° DN32 rustfritt', cat: 'Rørdeler',
      amount: 212, listAmount: 240, stock: 'in', lead: 'sendes i dag', material: 'Rustfritt stål 316L',
      breaks: [{minQty:1,price:212},{minQty:20,price:198},{minQty:80,price:182}] },
    { id: 'vlv-9120', sku: 'VLV-9120-CI', title: 'Sluseventil DN80 støpejern', cat: 'Ventiler',
      amount: 3540, listAmount: 3980, stock: 'backorder', lead: '3–5 virkedager', material: 'Støpejern GG25',
      breaks: [{minQty:1,price:3540},{minQty:6,price:3320},{minQty:24,price:3090}] },
    { id: 'flg-2280', sku: 'FLG-2280-PT', title: 'Blindflens DN65 PN16', cat: 'Flenser',
      amount: 318, listAmount: 360, stock: 'in', lead: 'sendes i dag', material: 'P250GH stål',
      breaks: [{minQty:1,price:318},{minQty:10,price:296},{minQty:40,price:272}] },
    { id: 'clp-035', sku: 'CLP-035-RB', title: 'Gummiisolert rørklemme 35 mm', cat: 'Klemmer',
      amount: 58, listAmount: 66, stock: 'out', lead: 'forventet 12.06', material: 'Stål + EPDM',
      breaks: [{minQty:1,price:58},{minQty:100,price:52},{minQty:500,price:46}] },
  ];
  const categories = ['Ventiler', 'Pakninger', 'Klemmer', 'Rørdeler', 'Flenser'];
  const orders = [
    { id: 'NO-104882', date: '04.06.2026', status: 'shipped', lines: 3, total: 18420, ref: 'Prosjekt Nordvik' },
    { id: 'NO-104871', date: '28.05.2026', status: 'delivered', lines: 7, total: 42980, ref: 'Lager påfyll' },
    { id: 'NO-104844', date: '21.05.2026', status: 'invoiced', lines: 2, total: 6360, ref: '' },
    { id: 'NO-104790', date: '09.05.2026', status: 'overdue', lines: 5, total: 28140, ref: 'Prosjekt Strand' },
    { id: 'NO-104755', date: '02.05.2026', status: 'delivered', lines: 4, total: 15280, ref: '' },
  ];
  const quotes = [
    { id: 'TIL-2041', date: '03.06.2026', status: 'quote', lines: 6, total: 64200, valid: '17.06.2026' },
    { id: 'TIL-2033', date: '27.05.2026', status: 'confirmed', lines: 3, total: 11900, valid: '—' },
  ];
  return { products, categories, orders, quotes,
    company: { name: 'Bergen Rør & VVS AS', orgnr: '912 345 678', terms: 'Netto 30', priceList: 'Engros A', credit: { limit: 250000, used: 96540 } } };
})();
