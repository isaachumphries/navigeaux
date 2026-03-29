'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
const DEFAULT_CENTER: [number, number] = [-91.1794, 30.4076];

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: DEFAULT_CENTER,
      zoom: 18,
      container: mapContainer.current!,
      canvasContextAttributes: { antialias: true }
    });

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });

    map.current.addControl(geolocate);
    map.current.on('load', () => {
      geolocate.trigger();
    });

    return () => map.current?.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
