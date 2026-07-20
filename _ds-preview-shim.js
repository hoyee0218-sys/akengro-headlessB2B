/* ===========================================================================
   DS PREVIEW SHIM  (preview-only convenience — not part of the runtime API)
   ---------------------------------------------------------------------------
   In the live Design System tab, _ds_bundle.js is injected and the component
   namespace (window.HeadlessB2BStorefrontDesignSystem_4ebfb1) already exists.
   When a card/kit is opened as a standalone file (author preview, or a
   consumer opening the HTML directly) that bundle isn't served, so this shim
   rebuilds the namespace from the component .jsx source on the fly (Babel must
   be loaded first). Safe to ship: it no-ops the moment the real bundle exists.

   Exposes: window.dsReady  →  Promise<namespaceObject>
   ======================================================================== */
(function () {
  var NS_NAME = 'HeadlessB2BStorefrontDesignSystem_4ebfb1';

  // Component files in dependency order, with their export names.
  var FILES = [
    ['components/buttons/Button.jsx', ['Button']],
    ['components/buttons/IconButton.jsx', ['IconButton']],
    ['components/forms/Input.jsx', ['Input']],
    ['components/forms/Select.jsx', ['Select']],
    ['components/forms/Checkbox.jsx', ['Checkbox']],
    ['components/forms/Switch.jsx', ['Switch']],
    ['components/data/Badge.jsx', ['Badge']],
    ['components/data/Tag.jsx', ['Tag']],
    ['components/data/Card.jsx', ['Card']],
    ['components/data/Tabs.jsx', ['Tabs']],
    ['components/commerce/PriceDisplay.jsx', ['PriceDisplay']],
    ['components/commerce/StockIndicator.jsx', ['StockIndicator']],
    ['components/commerce/QuantityStepper.jsx', ['QuantityStepper']],
    ['components/commerce/QtyBreakTable.jsx', ['QtyBreakTable']],
    ['components/commerce/DemoDataBadge.jsx', ['DemoDataBadge']],
    ['components/commerce/OrderStatusBadge.jsx', ['OrderStatusBadge']],
    ['components/commerce/ProductCard.jsx', ['ProductCard']],
  ];

  // Resolve project root from this script's own URL.
  var self = document.currentScript ? document.currentScript.src : '';
  var ROOT = self.replace(/[^/]*$/, '');

  window.dsReady = (async function () {
    if (window[NS_NAME]) return window[NS_NAME];           // real bundle present
    if (typeof Babel === 'undefined') {
      console.warn('[ds-preview-shim] Babel not loaded; cannot build from source.');
      return {};
    }
    window.__NS = {};
    var src = '';
    for (var i = 0; i < FILES.length; i++) {
      var f = FILES[i][0], exports = FILES[i][1];
      var t = await (await fetch(ROOT + f)).text();
      t = t.replace(/^\s*import\s+React[^\n]*\n/gm, '');
      t = t.replace(/^\s*import\s*\{([^}]*)\}[^\n]*\n/gm, 'const {$1} = window.__NS;\n');
      t = t.replace(/^export\s+/gm, '');
      src += '\n;(function(){\nconst React = window.React;\n' + t +
             '\nObject.assign(window.__NS, {' + exports.join(',') + '});\n})();\n';
    }
    var out = Babel.transform(src, { presets: ['react'] }).code;
    (new Function(out))();
    window[NS_NAME] = window.__NS;
    return window.__NS;
  })();
})();
