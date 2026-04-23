'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { NavigationResult } from './navigation';
import type { NavGraph } from './navigation';

interface GUIProps {
  graph: NavGraph;
  userGPS: React.RefObject<[number, number] | null>;
  gpsReady: boolean;
  onRouteFound: (result: NavigationResult, label: string) => void;
  onNavigationStart: () => void;
  onRouteClear: () => void;
}

export default function GUI({ graph, userGPS, gpsReady, onRouteFound, onNavigationStart, onRouteClear }: GUIProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; type: number; label: string }[]>([]);
  const [activeRoute, setActiveRoute] = useState<NavigationResult | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const allDestinations = useRef(
    graph.getDestinations().map(d => ({
      id: d.id,
      type: d.type,
      label: `PFT ${d.id.replace(/ROOM$/i, '').trim()}`,
    }))
  );

  const pendingRoom = useRef<{ id: string; label: string } | null>(null);

  // Read room param from URL on mount and pre-populate search.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (!roomParam) return;
    const q = roomParam.toLowerCase();
    const match = allDestinations.current.find(d =>
      d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
    if (match) {
      pendingRoom.current = { id: match.id, label: match.label };
      setQuery(match.label);
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim() === '') {
      setResults([]);
      return;
    }
    const q = value.toLowerCase();
    setResults(
      allDestinations.current.filter(d =>
        d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      )
    );
  }, []);

  const handleSelect = useCallback((destId: string, label: string) => {
    setQuery(label);
    setResults([]);
    setIsSearchFocused(false);
    setIsNavigating(false);

    if (!userGPS.current) {
      console.warn('GPS unavailable — cannot route without a known position.');
      return;
    }
    const result = graph.navigateToRoom(userGPS.current, destId);

    if (!result) {
      console.warn(`No route to ${destId}`);
      setActiveRoute(null);
      return;
    }

    setActiveRoute(result);
    onRouteFound(result, label);
  }, [graph, userGPS, onRouteFound]);

  const handleStart = useCallback(() => {
    setIsNavigating(true);
    onNavigationStart();
  }, [onNavigationStart]);

  // Once GPS is acquired, fire the pending route (preview, not started).
  useEffect(() => {
    if (!gpsReady || !pendingRoom.current) return;
    const { id, label } = pendingRoom.current;
    pendingRoom.current = null;
    handleSelect(id, label);
  }, [gpsReady, handleSelect]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setActiveRoute(null);
    setIsNavigating(false);
    onRouteClear();
  }, [onRouteClear]);

  return (
    <>
      {/* Search bar */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(360px, calc(100vw - 144px))',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: results.length > 0 && isSearchFocused ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            padding: '0 14px',
            height: 48,
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].id, results[0].label); }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search rooms..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              color: '#1f2937',
              background: 'transparent',
            }}
          />

          {query && (
            <button
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isSearchFocused && results.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0 0 12px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: 240,
              overflowY: 'auto',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id, r.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '12px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  color: '#374151',
                  borderBottom: '1px solid #f9fafb',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Route info banner */}
        {activeRoute && !isSearchFocused && (
          <div
            style={{
              marginTop: 8,
              background: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {activeRoute.turnCount} turn{activeRoute.turnCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                {activeRoute.distanceMeters < 1000
                  ? `${Math.round(activeRoute.distanceMeters)}m`
                  : `${(activeRoute.distanceMeters / 1000).toFixed(1)}km`}
              </div>
            </div>

            {isNavigating ? (
              <div
                style={{ background: '#ef4444', color: '#ffffff', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onClick={handleClear}
              >
                End
              </div>
            ) : (
              <div
                style={{ background: '#3b82f6', color: '#ffffff', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onClick={handleStart}
              >
                Start
              </div>
            )}
          </div>
        )}
      </div>

      {/* Events button */}
      <Link href="/events" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </Link>
    </>
  );
}
