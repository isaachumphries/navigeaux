'use client';
import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { NavGraph, RouteNavigator, type NavigationResult, haversine } from './navigation';
import {
  addFloorLayer, addRouteLayer, addBlueDotLayer,
  drawRoute, clearRoute, updateBlueDot, clearBlueDot,
  setGeolocateDotVisibility,
} from './mapLayers';
import SearchBar from './searchBar';
import graphData from '../pftF1Graph.json';

const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];
const SPEED_MPS      = (3 * 1609.344) / 3600; // 3 mph ≈ 1.341 m/s
const SNAP_THRESHOLD = 10;                     // meters
const GRACE_MS       = 5000;                   // ms before snap logic activates

const graph = new NavGraph(graphData as any);

type Simulator = ReturnType<RouteNavigator['simulate']>;

export default function Map() {
  const mapContainer  = useRef<HTMLDivElement>(null);
  const map           = useRef<maplibregl.Map | null>(null);
  const userGPS       = useRef<[number, number] | null>(null);
  const activeRoute   = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const simulatorRef  = useRef<Simulator | null>(null);
  const rafHandle     = useRef<number | null>(null);
  const lastTs        = useRef<number | null>(null);
  const navStartTs    = useRef<number | null>(null);

  const stopSimulation = useCallback(() => {
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
    simulatorRef.current = null;
    lastTs.current       = null;
    navStartTs.current   = null;
    if (map.current) clearBlueDot(map.current);
  }, []);

  const startSimulation = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>) => {
    stopSimulation();

    const sim = new RouteNavigator(route).simulate(SPEED_MPS);
    simulatorRef.current = sim;

    const tick = (ts: number) => {
      if (!map.current || simulatorRef.current !== sim) return;

      // Record the timestamp of the very first frame for grace-period tracking.
      if (lastTs.current === null) navStartTs.current = ts;

      const dt = lastTs.current === null ? 0 : (ts - lastTs.current) / 1000;
      lastTs.current = ts;

      const status = sim.step(dt);

      // Only apply snap logic after the 5-second grace period.
      const graceOver = navStartTs.current !== null && (ts - navStartTs.current) > GRACE_MS;
      if (graceOver && userGPS.current !== null &&
          haversine(userGPS.current, status.snappedPosition) > SNAP_THRESHOLD) {
        sim.syncToGPS(userGPS.current);
        const corrected = sim.step(0); // re-sample at snapped position without advancing
        updateBlueDot(map.current, corrected.snappedPosition as [number, number]);
      } else {
        updateBlueDot(map.current, status.snappedPosition as [number, number]);
      }

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
    stopSimulation(); // clear any in-progress navigation
    setGeolocateDotVisibility(map.current, true);
    activeRoute.current = result.route;
    drawRoute(map.current, result.route);
  }, [stopSimulation]);

  // Called when the user explicitly presses "Start" in the search bar.
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
    });

    return () => {
      stopSimulation();
      map.current?.remove();
    };
  }, [stopSimulation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <SearchBar
        graph={graph}
        userGPS={userGPS}
        onRouteFound={handleRouteFound}
        onNavigationStart={handleNavigationStart}
        onRouteClear={handleRouteClear}
      />
    </div>
  );
}
