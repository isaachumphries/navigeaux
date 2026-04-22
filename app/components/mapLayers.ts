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
      'line-width': 5,
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
