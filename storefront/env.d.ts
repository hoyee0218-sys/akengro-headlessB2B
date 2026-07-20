/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

// Custom env vars (BUILD.md §5). Augments the generated Env interface.
// Do not redeclare HydrogenEnv fields (e.g. SHOP_ID) as optional — that breaks
// assignability to createHydrogenContext's env parameter.
declare global {
  interface Env {
    INTEGRATION_MODE?: 'mock' | 'real';
    /** Optional override for merchantConfig.sparkLayer.siteId (local / Oxygen). */
    PUBLIC_SPARKLAYER_SITE_ID?: string;
    /** SparkLayer OAuth client id (dashboard API key) — server only. */
    SPARKLAYER_CLIENT_ID?: string;
    /** SparkLayer OAuth client secret — server only, never PUBLIC_. */
    SPARKLAYER_CLIENT_SECRET?: string;
    /**
     * Spark API host. Default https://app.sparklayer.io.
     * Sandbox: https://test.app.sparklayer.io
     */
    SPARKLAYER_API_BASE?: string;
  }
}
