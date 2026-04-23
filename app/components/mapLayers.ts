import maplibregl from 'maplibre-gl';

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

// MapLibre's GeolocateControl internally adds these layers when it first gets a position.
// Toggling their visibility hides/shows the GPS accuracy dot without stopping tracking.
const GEOLOCATE_LAYERS = [
  'maplibre-gl-js-user-location-dot',
  'maplibre-gl-js-user-location-accuracy-circle',
];

export function setGeolocateDotVisibility(map: maplibregl.Map, visible: boolean) {
  const v = visible ? 'visible' : 'none';
  for (const id of GEOLOCATE_LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
  }
}
