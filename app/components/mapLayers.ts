import maplibregl from 'maplibre-gl';

export function addFloorLayer(map: maplibregl.Map) {
  map.addSource('floor-1-source', {
    type: 'image',
    url: '/pft1floor_copy.png',
    coordinates: [
      [-91.180205266, 30.408772267], 
      [-91.178875990, 30.408404760],
      [-91.179523047, 30.406695062],
      [-91.180851915, 30.407061941]
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
