'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: DEFAULT_CENTER,
      zoom: 15.5,
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

      //floor 1
      map.current?.addSource('floor-1-source', {
        type: 'image',
        url: '/pft1floor_copy.png',
        coordinates: [
            [-91.1801422, 30.4090024], //top left
            [-91.1788229, 30.4086384], //top right
            [-91.1795364, 30.4066045], //bottom right
            [-91.1809503, 30.4069773], //bottom left
        ]
    });
 
 
    map.current?.addLayer({
        id: 'floor-1-layer',
        type: 'raster',
        source: 'floor-1-source',
        paint: {
            'raster-opacity': 1.0
        }
    });
 
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
