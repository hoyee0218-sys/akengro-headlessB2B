import {useCallback, useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import type {SparkSessionPayload} from '~/lib/spark';
import {sparkScriptUrl} from '~/lib/spark';

declare global {
  interface Window {
    initSpark?: (options: Record<string, unknown>) => unknown;
    spark?: unknown;
  }
}

type SparkLayerProps = {
  session: SparkSessionPayload | null;
};

export function SparkLayer({session}: SparkLayerProps) {
  const initialised = useRef(false);
  const logoutFetcher = useFetcher();

  const handleLogout = useCallback(() => {
    logoutFetcher.submit(null, {method: 'post', action: '/account/logout'});
  }, [logoutFetcher]);

  useEffect(() => {
    if (!session || initialised.current) return;
    if (typeof window === 'undefined') return;

    const src = sparkScriptUrl(session.siteId);

    const init = () => {
      if (initialised.current) return;
      if (typeof window.initSpark !== 'function') return;
      if (window.spark) {
        initialised.current = true;
        return;
      }
      window.spark = window.initSpark({
        siteId: session.siteId,
        platform: 'shopify',
        shopify: {useAppProxy: false},
        language: 'nb',
        onLogout: handleLogout,
        auth: {
          user: session.email,
          token: session.authenticationToken,
        },
      });
      initialised.current = true;
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-spark-layer="${session.siteId}"]`,
    );
    if (existing) {
      if (window.initSpark) init();
      else existing.addEventListener('load', init);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.sparkLayer = session.siteId;
    script.addEventListener('load', init);
    script.addEventListener('error', () => {
      console.error('[spark] Failed to load SparkLayer script', src);
    });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', init);
    };
  }, [session, handleLogout]);

  return null;
}
