'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, TriangleAlert } from 'lucide-react';
import { SYNTHETIC_ZONES } from '@/lib/constants';

type GoogleMap = {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Circle: new (options: Record<string, unknown>) => {
      addListener: (event: string, handler: () => void) => void;
      setMap: (map: null) => void;
    };
    InfoWindow: new (options: Record<string, unknown>) => {
      open: (options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __savoruneGoogleMapsPromise?: Promise<GoogleMapsApi>;
    __savoruneGoogleMapsReady?: () => void;
  }
}

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (window.__savoruneGoogleMapsPromise) return window.__savoruneGoogleMapsPromise;

  window.__savoruneGoogleMapsPromise = new Promise((resolve, reject) => {
    window.__savoruneGoogleMapsReady = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error('Google Maps loaded without the maps library.'));
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      callback: '__savoruneGoogleMapsReady',
      v: 'weekly',
      language: 'en',
      region: 'IN',
      auth_referrer_policy: 'origin',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      window.__savoruneGoogleMapsPromise = undefined;
      reject(new Error('Google Maps could not be loaded.'));
    };
    document.head.appendChild(script);
  });

  return window.__savoruneGoogleMapsPromise;
}

function MapFallback({ message }: { message: string }) {
  return (
    <div className="grid min-h-64 place-items-center bg-background px-6 py-8 text-center">
      <div className="max-w-md">
        <TriangleAlert className="mx-auto size-7 text-orange" aria-hidden="true" />
        <p className="mt-3 text-sm font-extrabold text-forest">Map unavailable</p>
        <p className="mt-2 text-sm leading-6 text-forest/60">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SYNTHETIC_ZONES.map((zone) => (
            <span key={zone.code} className="rounded-full border border-forest/10 bg-white px-3 py-1 text-xs font-bold text-forest/70">
              {zone.code} · {zone.name.split(' (')[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ZoneMap({ zoneCode }: { zoneCode: string }) {
  const selected = SYNTHETIC_ZONES.find((zone) => zone.code === zoneCode) || SYNTHETIC_ZONES[0];
  const mapElementRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing-key' | 'error'>('loading');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing-key');
      return;
    }

    let cancelled = false;
    const overlays: Array<{ setMap: (map: null) => void }> = [];

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapElementRef.current) return;
        const map = new google.maps.Map(mapElementRef.current, {
          center: { lat: selected.latitude, lng: selected.longitude },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          backgroundColor: '#f2f6ef',
        });

        for (const zone of SYNTHETIC_ZONES) {
          const isSelected = zone.code === selected.code;
          const circle = new google.maps.Circle({
            map,
            center: { lat: zone.latitude, lng: zone.longitude },
            radius: isSelected ? 520 : 270,
            strokeColor: isSelected ? '#102b24' : '#1f6b4d',
            strokeOpacity: 1,
            strokeWeight: isSelected ? 3 : 2,
            fillColor: isSelected ? '#a3d977' : '#1f6b4d',
            fillOpacity: isSelected ? 0.82 : 0.55,
            clickable: true,
          });
          const info = new google.maps.InfoWindow({
            content: `<div style="font-family:Inter,sans-serif;color:#102b24;padding:2px 4px"><strong>${zone.code}</strong><br>${zone.name}</div>`,
          });
          circle.addListener('click', () => info.open({
            map,
            position: { lat: zone.latitude, lng: zone.longitude },
          }));
          overlays.push(circle);
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [apiKey, selected.code, selected.latitude, selected.longitude]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-forest/10 bg-white shadow-sm">
      <div className="relative min-h-64 bg-background">
        {status === 'missing-key' ? (
          <MapFallback message="Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the interactive Google map. Zone selection still works without it." />
        ) : status === 'error' ? (
          <MapFallback message="The map service did not respond. You can continue using the Hyderabad zone list." />
        ) : (
          <>
            <div ref={mapElementRef} className="h-64 w-full" role="region" aria-label="Google map of synthetic SAVORUNE service zones in Hyderabad" />
            {status === 'loading' && (
              <div className="absolute inset-0 grid place-items-center bg-background/90 text-sm font-bold text-forest/60">Loading service-zone map…</div>
            )}
          </>
        )}
      </div>
      <div className="flex items-start gap-3 border-t border-forest/10 p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-natural" aria-hidden="true" />
        <div>
          <p className="text-sm font-extrabold">{selected.name}</p>
          <p className="mt-1 text-xs leading-5 text-forest/55">Approximate synthetic centroid only. SAVORUNE never displays a personal address.</p>
        </div>
      </div>
    </div>
  );
}
