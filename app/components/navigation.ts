// navigation.ts
// Clean graph-based indoor navigation using explicit nodes and edges.
// points, lines, and Dijkstra.

export type Coord = [number, number]; // [lng, lat]

interface NodeFeature {
  type: 'Feature';
  properties: {
    id: string;
    type: number; // 1=room, 2=hallway, 3=intersection, 4=door
    floor: number;
    room?: string;
  };
  geometry: { type: 'Point'; coordinates: Coord };
}

interface EdgeFeature {
  type: 'Feature';
  properties: {
    type: 'edge';
    from: string;
    to: string;
    distance: number;
  };
  geometry: { type: 'LineString'; coordinates: Coord[] };
}

interface GraphGeoJSON {
  type: 'FeatureCollection';
  features: (NodeFeature | EdgeFeature)[];
}

export interface GraphNode {
  id: string;
  coord: Coord;
  type: number;
}

export interface NavigationResult {
  route: GeoJSON.Feature<GeoJSON.LineString>;
  path: string[];
  distanceMeters: number;
  turnCount: number;
}

export class NavGraph {
  nodes: Map<string, GraphNode> = new Map();
  adjacency: Map<string, { to: string; weight: number }[]> = new Map();

  constructor(geojson: GraphGeoJSON) {
    this.build(geojson);
  }

  private build(geojson: GraphGeoJSON) {
    for (const f of geojson.features) {
      const props = f.properties as Record<string, unknown>;
      const geom = f.geometry;

      if (geom.type === 'Point' && typeof props.id === 'string') {
        // Node feature
        const id = props.id;
        this.nodes.set(id, {
          id,
          coord: geom.coordinates as Coord,
          type: props.type as number,
        });
        this.adjacency.set(id, []);
      } else if (props.type === 'edge' && geom.type === 'LineString') {
       // Edge feature — queued for second pass after all nodes are loaded
      }
    }

    for (const f of geojson.features) {
      const props = f.properties as Record<string, unknown>;
      if (props.type === 'edge') {
        const from = props.from as string;
        const to = props.to as string;
        const distance = props.distance as number;
        if (this.adjacency.has(from) && this.adjacency.has(to)) {
          this.adjacency.get(from)!.push({ to, weight: distance });
          this.adjacency.get(to)!.push({ to: from, weight: distance });
        }
      }
    }
  }

  nearestNode(point: Coord, walkableOnly = true): GraphNode | null {
    let best: GraphNode | null = null;
    let bestDist = Infinity;
    for (const node of this.nodes.values()) {
      if (walkableOnly && node.type === 1) continue;
      const edges = this.adjacency.get(node.id);
      if (!edges || edges.length === 0) continue;
      const d = haversine(point, node.coord);
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best;
  }

  /** Dijkstra shortest path. Returns node IDs or null if unreachable.
   *  Nodes whose type is in excludeIntermediate are never used as waypoints
   *  (only start/end are exempt from this restriction). */
  findPath(startId: string, endId: string, excludeIntermediate: Set<number> = new Set()): string[] | null {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) return null;

    const dist: Map<string, number> = new Map();
    const prev: Map<string, string | null> = new Map();
    const visited: Set<string> = new Set();

    for (const id of this.nodes.keys()) {
      dist.set(id, Infinity);
      prev.set(id, null);
    }
    dist.set(startId, 0);

    while (visited.size < this.nodes.size) {
      let current: string | null = null;
      let currentDist = Infinity;
      for (const [id, d] of dist) {
        if (!visited.has(id) && d < currentDist) {
          currentDist = d;
          current = id;
        }
      }

      if (current === null) break;
      if (current === endId) break;
      visited.add(current);

      for (const { to, weight } of this.adjacency.get(current)!) {
        if (visited.has(to)) continue;
        if (to !== endId && excludeIntermediate.has(this.nodes.get(to)!.type)) continue;
        const alt = currentDist + weight;
        if (alt < dist.get(to)!) {
          dist.set(to, alt);
          prev.set(to, current);
        }
      }
    }

    if (dist.get(endId) === Infinity) return null;
    const path: string[] = [];
    let curr: string | null = endId;
    while (curr !== null) {
      path.unshift(curr);
      curr = prev.get(curr) ?? null;
    }
    return path;
  }

  pathToGeoJSON(path: string[]): GeoJSON.Feature<GeoJSON.LineString> {
    const coords: Coord[] = path.map(id => this.nodes.get(id)!.coord);
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    };
  }

  navigateTo(userGPS: Coord, destId: string): NavigationResult | null {
    const start = this.nearestNode(userGPS);
    if (!start) return null;

    const path = this.findPath(start.id, destId);
    if (!path) return null;

    const turnCount = path.filter(id => this.nodes.get(id)!.type === 3).length;

    return {
      route: this.pathToGeoJSON(path),
      path,
      distanceMeters: this.pathDistance(path),
      turnCount,
    };
  }

  /**
   * Navigate from any GPS position to a room by its number (e.g. "1100", "1263").
   *
   * How it works:
   * 1. Finds the room node whose ID contains the room number
   *    (falls back to searching door nodes if no room node matches)
   * 2. Finds the nearest routable node to that room/door (the "entry point")
   * 3. Finds the nearest routable node to the user's GPS (the "start")
   * 4. Runs Dijkstra between start and entry point
   *
   * This means you can call: graph.navigateToRoom(userGPS, "1263")
   * and it just works 
   */
  navigateToRoom(userGPS: Coord, roomQuery: string): NavigationResult | null {
    const destNode = this.findRoomNode(roomQuery);
    if (!destNode) {
      console.warn(`No room or door found matching "${roomQuery}"`);
      return null;
    }

    const start = this.nearestNode(userGPS);
    if (!start) return null;

    const candidates = destNode.type === 4
      ? [destNode]
      : this.findRoomDoors(destNode);

    // Room nodes (type 1) must not be used as intermediate waypoints.
    const excludeRooms = new Set([1]);
    let best: NavigationResult | null = null;

    for (const door of candidates) {
      const path = this.findPath(start.id, door.id, excludeRooms);
      if (!path) continue;
      const distanceMeters = this.pathDistance(path);
      if (best === null || distanceMeters < best.distanceMeters) {
        best = {
          route: this.pathToGeoJSON(path),
          path,
          distanceMeters,
          turnCount: path.filter(id => this.nodes.get(id)!.type === 3).length,
        };
      }
    }

    return best;
  }

  /** Returns all door nodes (type 4) whose ID shares the room's name prefix.
   *  Falls back to the single nearest routable non-room node if none found. */
  private findRoomDoors(roomNode: GraphNode): GraphNode[] {
    const prefix = roomNode.id.replace(/ROOM$/i, '').toLowerCase();
    const doors: GraphNode[] = [];

    for (const node of this.nodes.values()) {
      if (node.type !== 4) continue;
      const edges = this.adjacency.get(node.id);
      if (!edges || edges.length === 0) continue;
      if (node.id.toLowerCase().startsWith(prefix)) doors.push(node);
    }

    if (doors.length > 0) return doors;

    // Fallback: nearest routable non-room node
    let best: GraphNode | null = null;
    let bestDist = Infinity;
    for (const node of this.nodes.values()) {
      if (node.type === 1) continue;
      const edges = this.adjacency.get(node.id);
      if (!edges || edges.length === 0) continue;
      const d = haversine(roomNode.coord, node.coord);
      if (d < bestDist) { bestDist = d; best = node; }
    }
    return best ? [best] : [];
  }

  /**
   * Find a room or door node matching a query string.
   * Searches room nodes first, then doors, matching against the node ID.
   * Examples: "1100" matches room_1 if its name contains 1100,
   * or you can pass the raw node id like "room_1" or "door_5".
   */
  private findRoomNode(query: string): GraphNode | null {
    const q = query.toLowerCase().trim();

    if (this.nodes.has(q)) return this.nodes.get(q)!;

    for (const targetType of [1, 4]) {
      for (const node of this.nodes.values()) {
        if (node.type === targetType && node.id.toLowerCase().includes(q)) {
          return node;
        }
      }
    }

    for (const node of this.nodes.values()) {
      if (node.id.toLowerCase().includes(q)) return node;
    }

    return null;
  }

  getDestinations(): { id: string; type: number; coord: Coord }[] {
    const results: { id: string; type: number; coord: Coord }[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === 1) {
        results.push({ id: node.id, type: node.type, coord: node.coord });
      }
    }
    return results.sort((a, b) => a.id.localeCompare(b.id));
  }

  private pathDistance(path: string[]): number {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += haversine(
        this.nodes.get(path[i])!.coord,
        this.nodes.get(path[i + 1])!.coord
      );
    }
    return total;
  }
}



export interface NavStatus {
  snappedPosition: Coord;
  distanceFromRoute: number;
  distanceAlongRoute: number;
  totalDistance: number;
  progress: number;
  isOffRoute: boolean;
  hasArrived: boolean;
}

export interface RouteNavigatorOptions {
  snapTolerance?: number;
  offRouteThreshold?: number;
  arrivalThreshold?: number;
}

export class RouteNavigator {
  private routeCoords: Coord[];
  private segmentLengths: number[];
  private totalLength: number;
  private snapTolerance: number;
  private offRouteThreshold: number;
  private arrivalThreshold: number;

  constructor(
    route: GeoJSON.Feature<GeoJSON.LineString>,
    options: RouteNavigatorOptions = {}
  ) {
    this.routeCoords = route.geometry.coordinates as Coord[];
    this.snapTolerance = options.snapTolerance ?? 15;
    this.offRouteThreshold = options.offRouteThreshold ?? 25;
    this.arrivalThreshold = options.arrivalThreshold ?? 5;

    this.segmentLengths = [];
    this.totalLength = 0;
    for (let i = 0; i < this.routeCoords.length - 1; i++) {
      const len = haversine(this.routeCoords[i], this.routeCoords[i + 1]);
      this.segmentLengths.push(len);
      this.totalLength += len;
    }
  }

  update(userGPS: Coord): NavStatus {
    const { point, distanceFromRoute, distanceAlongRoute } =
      this.closestPointOnRoute(userGPS);

    const distToEnd = this.totalLength - distanceAlongRoute;

    return {
      snappedPosition: point,
      distanceFromRoute,
      distanceAlongRoute,
      totalDistance: this.totalLength,
      progress: this.totalLength > 0 ? distanceAlongRoute / this.totalLength : 1,
      isOffRoute: distanceFromRoute > this.offRouteThreshold,
      hasArrived: distToEnd < this.arrivalThreshold,
    };
  }

  /**
   * Create a simulation that advances along the route at a fixed speed.
   * Returns a stepper function: call it with delta time (seconds) to get
   * the next NavStatus. Useful for demos and testing without walking.
   *
   * Usage:
   *   const step = navigator.simulate(1.4); // walking pace m/s
   *   setInterval(() => {
   *     const status = step(0.5); // advance 0.5 seconds
   *     updateMarker(status.snappedPosition);
   *   }, 500);
   */
  simulate(speedMps: number = 1.4): { step: (dtSeconds: number) => NavStatus; syncToGPS: (gps: Coord) => void } {
    let currentDistance = 0;

    const step = (dt: number): NavStatus => {
      currentDistance = Math.min(currentDistance + speedMps * dt, this.totalLength);
      const point = this.pointAtDistance(currentDistance);
      return {
        snappedPosition: point,
        distanceFromRoute: 0,
        distanceAlongRoute: currentDistance,
        totalDistance: this.totalLength,
        progress: this.totalLength > 0 ? currentDistance / this.totalLength : 1,
        isOffRoute: false,
        hasArrived: (this.totalLength - currentDistance) < this.arrivalThreshold,
      };
    };

    const syncToGPS = (gps: Coord): void => {
      currentDistance = this.closestPointOnRoute(gps).distanceAlongRoute;
    };

    return { step, syncToGPS };
  }

  private closestPointOnRoute(point: Coord): {
    point: Coord;
    distanceFromRoute: number;
    distanceAlongRoute: number;
  } {
    let bestDist = Infinity;
    let bestPoint: Coord = this.routeCoords[0];
    let bestAlongRoute = 0;
    let cumulativeDistance = 0;

    for (let i = 0; i < this.routeCoords.length - 1; i++) {
      const a = this.routeCoords[i];
      const b = this.routeCoords[i + 1];
      const segLen = this.segmentLengths[i];

      const projected = projectPointOnSegment(point, a, b);
      const dist = haversine(point, projected.point);

      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = projected.point;
        bestAlongRoute = cumulativeDistance + projected.t * segLen;
      }

      cumulativeDistance += segLen;
    }

    return {
      point: bestPoint,
      distanceFromRoute: bestDist,
      distanceAlongRoute: bestAlongRoute,
    };
  }

  private pointAtDistance(distance: number): Coord {
    if (distance <= 0) return this.routeCoords[0];

    let remaining = distance;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      if (remaining <= this.segmentLengths[i]) {
        const t = remaining / this.segmentLengths[i];
        return lerp(this.routeCoords[i], this.routeCoords[i + 1], t);
      }
      remaining -= this.segmentLengths[i];
    }
    return this.routeCoords[this.routeCoords.length - 1];
  }
}

export function haversine(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function lerp(a: Coord, b: Coord, t: number): Coord {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}


function projectPointOnSegment(
  p: Coord,
  a: Coord,
  b: Coord
): { point: Coord; t: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-20) {
    return { point: a, t: 0 };
  }

  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return {
    point: lerp(a, b, t),
    t,
  };
}
