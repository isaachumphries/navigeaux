'use client';
import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { NavGraph, type NavigationResult } from './navigation';
import { addFloorLayer, addRouteLayer, drawRoute, clearRoute } from './mapLayers';
import SearchBar from './searchBar';
import graphData from '../pftF1Graph.json';

const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];

const graph = new NavGraph(graphData as any);

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userGPS = useRef<[number, number] | null>(null);

  const handleRouteFound = useCallback((result: NavigationResult) => {
    if (map.current) drawRoute(map.current, result.route);
  }, []);

  const handleRouteClear = useCallback(() => {
    if (map.current) clearRoute(map.current);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: DEFAULT_CENTER,
      zoom: 15.5,
      container: mapContainer.current!,
      canvasContextAttributes: { antialias: true },
    });

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    map.current.addControl(geolocate);

    map.current.on('load', () => {
      geolocate.trigger();
      addFloorLayer(map.current!);
      addRouteLayer(map.current!);
    });

    geolocate.on('geolocate', (e: GeolocationPosition) => {
      userGPS.current = [e.coords.longitude, e.coords.latitude];
    });

    return () => map.current?.remove();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <SearchBar
        graph={graph}
        userGPS={userGPS}
        onRouteFound={handleRouteFound}
        onRouteClear={handleRouteClear}
      />
    </div>
  );
}
