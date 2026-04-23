'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { NavGraph, RouteNavigator, type NavigationResult } from './navigation';
import {
  addFloorLayer, addFloor2Layer, addRouteLayer, addBlueDotLayer,
  drawRoute, clearRoute, updateBlueDot, clearBlueDot,
  setGeolocateDotVisibility, setFloorVisibility, FLOOR_COUNT,
} from './mapLayers';
// TODO: import pftF2Graph from '../pftF2Graph.json' when floor-2 data is ready
import GUI from './gui';
import graphData from '../pftF1Graph.json';

const DEFAULT_CENTER: [number, number] = [-91.17780950467707, 30.41340666855488];
const SPEED_MPS        = (2 * 1609.344) / 3600; // 2 mph ≈ 0.894 m/s
const SNAP_THROTTLE_MS = 5000;                  // cooldown between processed GPS snaps

const graph = new NavGraph(graphData as any);

type Simulator = ReturnType<RouteNavigator['simulate']>;

export default function Map() {
  const [gpsReady, setGpsReady] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  const gpsReadyRef        = useRef(false);
  const destinationLabel   = useRef<string>('');

  const mapContainer  = useRef<HTMLDivElement>(null);
  const map           = useRef<maplibregl.Map | null>(null);
  const userGPS       = useRef<[number, number] | null>(null);
  const activeRoute   = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const simulatorRef  = useRef<Simulator | null>(null);
  const rafHandle     = useRef<number | null>(null);
  const lastTs        = useRef<number | null>(null);
  const geolocateRef  = useRef<maplibregl.GeolocateControl | null>(null);
  const pendingGPS    = useRef<[number, number] | null>(null);
  const snapTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSimulation = useCallback(() => {
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
    simulatorRef.current = null;
    lastTs.current       = null;
    pendingGPS.current   = null;
    if (snapTimer.current !== null) { clearTimeout(snapTimer.current); snapTimer.current = null; }
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
        simulatorRef.current = null;
        setArrivedAt(destinationLabel.current);
        return;
      }

      rafHandle.current = requestAnimationFrame(tick);
    };

    rafHandle.current = requestAnimationFrame(tick);
  }, [stopSimulation]);

  const handleRouteFound = useCallback((result: NavigationResult, label: string) => {
    if (!map.current) return;
    stopSimulation();
    setArrivedAt(null);
    destinationLabel.current = label;
    if (geolocateRef.current) setGeolocateDotVisibility(geolocateRef.current, true);
    activeRoute.current = result.route;
    drawRoute(map.current, result.route);
  }, [stopSimulation]);

  const handleNavigationStart = useCallback(() => {
    if (!activeRoute.current || !map.current) return;
    if (geolocateRef.current) setGeolocateDotVisibility(geolocateRef.current, false);
    startSimulation(activeRoute.current);
  }, [startSimulation]);

  const handleRouteClear = useCallback(() => {
    if (!map.current) return;
    clearRoute(map.current);
    stopSimulation();
    setArrivedAt(null);
    activeRoute.current = null;
    if (geolocateRef.current) setGeolocateDotVisibility(geolocateRef.current, true);
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
    geolocateRef.current = geolocate;
    map.current.addControl(geolocate);

    map.current.on('load', () => {
      geolocate.trigger();
      addFloorLayer(map.current!);
      addFloor2Layer(map.current!);
      addRouteLayer(map.current!);
      addBlueDotLayer(map.current!);
    });

    // Snaps the sim to coord, renders immediately, then starts the cooldown timer.
    // When the timer fires, any queued trailing update is processed and the
    // cooldown restarts — implementing throttle-with-trailing-update semantics.
    const processSnap = (coord: [number, number]) => {
      const sim = simulatorRef.current;
      if (!sim || !map.current) return;

      sim.syncToGPS(coord);
      const snapped = sim.step(0);
      updateBlueDot(map.current, snapped.snappedPosition as [number, number]);

      snapTimer.current = setTimeout(() => {
        snapTimer.current = null;
        const pending = pendingGPS.current;
        if (pending !== null) {
          pendingGPS.current = null;
          processSnap(pending); // trailing update: process and restart cooldown
        }
      }, SNAP_THROTTLE_MS);
    };

    geolocate.on('geolocate', (e: GeolocationPosition) => {
      userGPS.current = [e.coords.longitude, e.coords.latitude];
      if (!gpsReadyRef.current) { gpsReadyRef.current = true; setGpsReady(true); }

      const sim = simulatorRef.current;
      if (!sim) return;

      // MapLibre re-shows the dot on every GPS event; re-hide it each time.
      setGeolocateDotVisibility(geolocate, false);

      if (snapTimer.current === null) {
        // No active cooldown — process immediately.
        processSnap(userGPS.current);
      } else {
        // In cooldown — park as trailing update (overwrites any earlier queued value).
        pendingGPS.current = [userGPS.current[0], userGPS.current[1]];
      }
    });

    return () => {
      stopSimulation();
      map.current?.remove();
    };
  }, [stopSimulation]);

  useEffect(() => {
    if (!map.current) return;
    setFloorVisibility(map.current, currentFloor);
  }, [currentFloor]);

  const btnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    border: 'none',
    background: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#374151',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <GUI
        graph={graph}
        userGPS={userGPS}
        gpsReady={gpsReady}
        onRouteFound={handleRouteFound}
        onNavigationStart={handleNavigationStart}
        onRouteClear={handleRouteClear}
      />

      {/* Arrival modal */}
      {arrivedAt && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            padding: '28px 32px',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            pointerEvents: 'auto',
            maxWidth: 300,
            width: '80vw',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>You have arrived at</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>{arrivedAt}</div>
            <button
              onClick={handleRouteClear}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 28px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floor switcher */}
      <div style={{
        position: 'absolute',
        right: 16,
        bottom: 100,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>
        <button
          style={{ ...btnStyle, borderBottom: '1px solid #f3f4f6' }}
          disabled={currentFloor >= FLOOR_COUNT}
          onClick={() => setCurrentFloor(f => Math.min(f + 1, FLOOR_COUNT))}
        >▲</button>
        <div style={{
          width: 40,
          height: 36,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: '#1f2937',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderBottom: '1px solid #f3f4f6',
        }}>
          F{currentFloor}
        </div>
        <button
          style={btnStyle}
          disabled={currentFloor <= 1}
          onClick={() => setCurrentFloor(f => Math.max(f - 1, 1))}
        >▼</button>
      </div>
    </div>
  );
}
