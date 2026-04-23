#!/usr/bin/env node
// Combines pftF1Nodes.json + pftF1Edges.json into pftF1Graph.json
// in the format navigation.ts expects: string node IDs, edge features with from/to/distance.

const fs = require('fs');
const path = require('path');

const nodesRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app/pftF1Nodes.json'), 'utf8'));
const edgesRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app/pftF1Edges.json'), 'utf8'));

function haversine(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Build node ID from name or numeric id
function nodeId(props) {
  return props.name ? String(props.name) : `n_${props.id}`;
}

// Build coord lookup: rounded key -> nodeId
const coordToId = new Map();
const nodeFeatures = [];

for (const f of nodesRaw.features) {
  const p = f.properties;
  const id = nodeId(p);
  const [lng, lat] = f.geometry.coordinates;

  // Store several rounding levels for fuzzy match
  for (const digits of [9, 8, 7, 6, 5]) {
    const key = `${lng.toFixed(digits)},${lat.toFixed(digits)}`;
    if (!coordToId.has(key)) coordToId.set(key, id);
  }

  nodeFeatures.push({
    type: 'Feature',
    properties: { id, type: p.type, floor: p.floor },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  });
}

// Also build a list of all nodes for nearest-coord fallback
const allNodes = nodesRaw.features.map(f => ({
  id: nodeId(f.properties),
  coord: f.geometry.coordinates,
}));

function findNodeId(coord) {
  const [lng, lat] = coord;
  for (const digits of [9, 8, 7, 6, 5, 4]) {
    const key = `${lng.toFixed(digits)},${lat.toFixed(digits)}`;
    if (coordToId.has(key)) return coordToId.get(key);
  }
  // Fallback: nearest node within 2m
  let best = null, bestDist = Infinity;
  for (const n of allNodes) {
    const d = haversine(coord, n.coord);
    if (d < bestDist) { bestDist = d; best = n.id; }
  }
  if (bestDist < 2) return best;
  return null;
}

const edgeFeatures = [];
let skipped = 0;

for (const f of edgesRaw.features) {
  const coords = f.geometry.coordinates;
  const from = findNodeId(coords[0]);
  const to = findNodeId(coords[coords.length - 1]);

  if (!from || !to) {
    console.warn(`Skipped edge ${f.properties.edge_id}: could not resolve from=${from} to=${to}`);
    skipped++;
    continue;
  }

  if (from === to) continue; // degenerate

  const distance = haversine(coords[0], coords[coords.length - 1]);

  edgeFeatures.push({
    type: 'Feature',
    properties: { type: 'edge', from, to, distance: Math.round(distance * 100) / 100 },
    geometry: { type: 'LineString', coordinates: coords },
  });
}

const graph = {
  type: 'FeatureCollection',
  features: [...nodeFeatures, ...edgeFeatures],
};

const outPath = path.resolve(__dirname, '../app/pftF1Graph.json');
fs.writeFileSync(outPath, JSON.stringify(graph, null, 2));
console.log(`Written: ${nodeFeatures.length} nodes, ${edgeFeatures.length} edges (${skipped} skipped) → ${outPath}`);
