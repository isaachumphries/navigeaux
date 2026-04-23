import maplibregl from 'maplibre-gl';

export const FLOOR_COUNT = 2;

export function addFloorLayer(map: maplibregl.Map) {
  map.addSource('floor-1-source', {
    type: 'image',
    url: '/pft1floor_copy.png',
    coordinates: [
      [-91.1801422, 30.4090024],
      [-91.1788229, 30.4086384],
      [-91.1795364, 30.4066045],
      [-91.1809503, 30.4069773],
    ],
  });

  map.addLayer({
    id: 'floor-1-layer',
    type: 'raster',
    source: 'floor-1-source',
    paint: { 'raster-opacity': 1.0 },
  });
}

export function addFloor2Layer(map: maplibregl.Map) {
  map.addSource('floor-2-source', {
    type: 'image',
    url: '/pft2floor.png',
    coordinates: [
      [-91.1788229, 30.4086384],
      [-91.1795364, 30.4066045],
      [-91.1809159, 30.4069607],
      [-91.1801422, 30.4090024],
    ],
  });

  map.addLayer({
    id: 'floor-2-layer',
    type: 'raster',
    source: 'floor-2-source',
    paint: { 'raster-opacity': 1.0 },
    layout: { visibility: 'none' },
  });
}

export function setFloorVisibility(map: maplibregl.Map, floor: number) {
  const layers: { id: string; floor: number }[] = [
    { id: 'floor-1-layer', floor: 1 },
    { id: 'floor-2-layer', floor: 2 },
  ];
  for (const entry of layers) {
    if (map.getLayer(entry.id)) {
      map.setLayoutProperty(entry.id, 'visibility', entry.floor === floor ? 'visible' : 'none');
    }
  }
}

export function addRouteLayer(map: maplibregl.Map) {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 10,
      'line-opacity': 0.85,
    },
  });
}

export function drawRoute(map: maplibregl.Map, route: GeoJSON.Feature<GeoJSON.LineString>) {
  const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
  src?.setData(route);
}

export function clearRoute(map: maplibregl.Map) {
  const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
  src?.setData({ type: 'FeatureCollection', features: [] });
}

export function addBlueDotLayer(map: maplibregl.Map) {
  map.addSource('blue-dot', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'blue-dot-border', type: 'circle', source: 'blue-dot',
    paint: { 'circle-radius': 10, 'circle-color': '#ffffff' } });
  map.addLayer({ id: 'blue-dot-fill', type: 'circle', source: 'blue-dot',
    paint: { 'circle-radius': 7, 'circle-color': '#3b82f6' } });
}

export function updateBlueDot(map: maplibregl.Map, coord: [number, number]) {
  const src = map.getSource('blue-dot') as maplibregl.GeoJSONSource | undefined;
  src?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coord } });
}

export function clearBlueDot(map: maplibregl.Map) {
  const src = map.getSource('blue-dot') as maplibregl.GeoJSONSource | undefined;
  src?.setData({ type: 'FeatureCollection', features: [] });
}

// MapLibre's GeolocateControl renders the user-location dot as DOM elements
// (via its internal Marker API), not as GL layers. We target them directly so
// the hide persists even when MapLibre calls _updateMarker on each GPS event.
export function setGeolocateDotVisibility(geolocate: maplibregl.GeolocateControl, visible: boolean) {
  const ctrl = geolocate as any;
  const display = visible ? '' : 'none';
  if (ctrl._dotElement)            (ctrl._dotElement as HTMLElement).style.display = display;
  if (ctrl._accuracyCircleElement) (ctrl._accuracyCircleElement as HTMLElement).style.display = display;
}
