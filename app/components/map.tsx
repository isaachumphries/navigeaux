'use client';
import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { NavGraph, RouteNavigator, type NavigationResult } from './navigation';
import {
  addFloorLayer, addRouteLayer, addBlueDotLayer,
  drawRoute, clearRoute, updateBlueDot, clearBlueDot,
  setGeolocateDotVisibility,
} from './mapLayers';
import GUI from './gui';
import graphData from '../pftF1Graph.json';

const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];
const SPEED_MPS = (2 * 1609.344) / 3600; // 2 mph ≈ 0.894 m/s

const graph = new NavGraph(graphData as any);

type Simulator = ReturnType<RouteNavigator['simulate']>;

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map          = useRef<maplibregl.Map | null>(null);
  const userGPS      = useRef<[number, number] | null>(null);
  const activeRoute  = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const simulatorRef = useRef<Simulator | null>(null);
  const rafHandle    = useRef<number | null>(null);
  const lastTs       = useRef<number | null>(null);

  const stopSimulation = useCallback(() => {
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
    simulatorRef.current = null;
    lastTs.current       = null;
    if (map.current) clearBlueDot(map.current);
  }, []);

  const startSimulation = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>) => {
    stopSimulation();

    const sim = new RouteNavigator(route).simulate(SPEED_MPS);
    simulatorRef.current = sim;

    const tick = (ts: number) => {
      if (!map.current || simulatorRef.current !== sim) return;

      const dt = lastTs.current === null ? 0 : (ts - lastTs.current) / 1000;
      lastTs.current = ts;

      const status = sim.step(dt);
      updateBlueDot(map.current, status.snappedPosition as [number, number]);

      if (status.hasArrived) {
        clearBlueDot(map.current);
        return;
      }

      rafHandle.current = requestAnimationFrame(tick);
    };

    rafHandle.current = requestAnimationFrame(tick);
  }, [stopSimulation]);

  // Draws the route line immediately; does NOT start animation yet.
  const handleRouteFound = useCallback((result: NavigationResult) => {
    if (!map.current) return;
    stopSimulation();
    setGeolocateDotVisibility(map.current, true);
    activeRoute.current = result.route;
    drawRoute(map.current, result.route);
  }, [stopSimulation]);

  // Called when the user explicitly presses "Start".
  const handleNavigationStart = useCallback(() => {
    if (!activeRoute.current || !map.current) return;
    setGeolocateDotVisibility(map.current, false);
    startSimulation(activeRoute.current);
  }, [startSimulation]);

  const handleRouteClear = useCallback(() => {
    if (!map.current) return;
    clearRoute(map.current);
    stopSimulation();
    activeRoute.current = null;
    setGeolocateDotVisibility(map.current, true);
  }, [stopSimulation]);

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
      addBlueDotLayer(map.current!);
    });

    geolocate.on('geolocate', (e: GeolocationPosition) => {
      userGPS.current = [e.coords.longitude, e.coords.latitude];
      // On every GPS update during active navigation, snap the dot to the nearest
      // point on the route to the real position, then resume at 2 mph from there.
      if (simulatorRef.current) simulatorRef.current.syncToGPS(userGPS.current);
    });

    return () => {
      stopSimulation();
      map.current?.remove();
    };
  }, [stopSimulation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <GUI
        graph={graph}
        userGPS={userGPS}
        onRouteFound={handleRouteFound}
        onNavigationStart={handleNavigationStart}
        onRouteClear={handleRouteClear}
      />
    </div>
  );
}
