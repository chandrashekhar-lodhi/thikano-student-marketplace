import React, { createContext, useContext, useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface MapsConfigContextValue {
  apiKey: string;
  loading: boolean;
  configured: boolean;
}

const MapsConfigContext = createContext<MapsConfigContextValue>({
  apiKey: '',
  loading: true,
  configured: false,
});

export function useMapsConfig() {
  return useContext(MapsConfigContext);
}

/**
 * Tier 2 Quota Defense: inspect async Google Maps Platform SDK / Places API errors
 * and dispatch 'gmp-quota-exceeded' only for real quota/auth failures (never for 0 results).
 */
export function reportQuotaExceededIfApplicable(err: unknown): boolean {
  if (!err) return false;
  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
      ? `${err.name} ${err.message}`
      : JSON.stringify(err);
  const status = (err as { status?: number | string; code?: number | string })?.status;
  const code = (err as { code?: number | string })?.code;

  const isQuotaOrAuth =
    status === 429 ||
    code === 429 ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('OVER_QUERY_LIMIT') ||
    raw.includes('OverQuotaMapError') ||
    raw.includes('QuotaExceededError') ||
    raw.includes('429');

  if (isQuotaOrAuth) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return true;
  }
  return false;
}

export function MapsProvider({ children }: { children: React.ReactNode }) {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [apiKey, setApiKey] = useState<string>(envKey);
  const [loading, setLoading] = useState<boolean>(!envKey);

  useEffect(() => {
    if (envKey) {
      setApiKey(envKey);
      setLoading(false);
      return;
    }

    let active = true;
    fetch('/api/maps/config')
      .then((res) => (res.ok ? res.json() : { apiKey: '' }))
      .then((data: { apiKey?: string }) => {
        if (!active) return;
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {
        // Leave empty so UI displays clean setup guidance without crashing
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [envKey]);

  const value: MapsConfigContextValue = {
    apiKey,
    loading,
    configured: Boolean(apiKey),
  };

  if (!apiKey) {
    return <MapsConfigContext.Provider value={value}>{children}</MapsConfigContext.Provider>;
  }

  return (
    <MapsConfigContext.Provider value={value}>
      <APIProvider apiKey={apiKey} language="en" region="IN" libraries={['places', 'marker']}>
        {children}
      </APIProvider>
    </MapsConfigContext.Provider>
  );
}
