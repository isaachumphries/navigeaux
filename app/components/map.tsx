'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get user's location first
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      // Initialize the map centered on user
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // free, no API key
        center: [longitude, latitude],
        zoom: 15,
      });

      // Add a marker at user's location
      new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
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