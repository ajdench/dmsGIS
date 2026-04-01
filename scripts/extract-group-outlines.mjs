/**
 * extract-group-outlines.mjs
 *
 * Reads the two canonical simplified boundary GeoJSONs (v10 and 2026),
 * converts each to a TopoJSON archive (.topo.json), then for every preset
 * that references that boundary file extracts a per-group exterior arc
 * GeoJSON using the preset's codeGroupings.
 *
 * For the Current preset the three ward-split ICBs (E54000042, E54000025,
 * E54000048) are excluded from codeGroupings.  Their sub-polygon features
 * from UK_WardSplit_simplified.geojson carry a `region_ref` property that
 * maps them into DPHC groups; those features are merged in when building
 * each group's topology so the exterior arc covers the full region.
 *
 * Outputs
 *   public/data/regions/*.topo.json          TopoJSON archives
 *   public/data/regions/outlines/<preset>_<group>.geojson
 *
 * Usage
 *   node scripts/extract-group-outlines.mjs
 */

import { topology } from 'topojson-server';
import { mesh } from 'topojson-client';
import fs from 'fs';
import path from 'path';
import dissolve from '@turf/dissolve';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const OUTLINES = path.join(REGIONS, 'outlines');
const CONFIG = path.join(ROOT, 'src', 'lib', 'config', 'viewPresets.json');
const PRESET_COLLECTION_OUTPUTS = {
  coa3a: 'UK_JMC_Outline_arcs.geojson',
  coa3b: 'UK_COA3A_Outline_arcs.geojson',
  coa3c: 'UK_COA3B_Outline_arcs.geojson',
};
const CURRENT_SPLIT_PARENT_CODES = new Set(['E54000025', 'E54000042', 'E54000048']);
const SHELL_EPSILON = 1e-6;
const DISSOLVE_REFERENCE_EPSILON = 1e-5;
const LINE_NODE_PRECISION = 7;
const CURRENT_KNOWN_EXCLUDED_SEGMENTS = new Map([
  ['Central & Wessex', [
    [[-1.606092162566745, 50.97475763424615], [-1.619751051433103, 50.958566891040576]],
    [[-1.603075106296357, 50.97833219637941], [-1.604904704594691, 50.976164593318344]],
    [[-1.619432546227886, 50.98472207898823], [-1.619723714983771, 50.9830762720422]],
    [[-1.618980577516788, 50.98727655271801], [-1.619070856398087, 50.98676632991061]],
    [[-1.618958720929101, 50.98740007635013], [-1.618962474656326, 50.98737886201456]],
    [[-1.619540020579129, 50.987672484289455], [-1.618958720929101, 50.98740007635013]],
    [[-1.624749670665667, 50.99011354877915], [-1.6242391470279, 50.989874356702266]],
    [[-1.625364068031521, 50.99069896274061], [-1.625345427072826, 50.99065347042919]],
    [[-1.628132351616869, 50.99745378639705], [-1.628107876483447, 50.99739407413407]],
    [[-1.628305726212586, 50.99787676583073], [-1.628193158782532, 50.99760213764673]],
    [[-1.628523215864711, 50.99840736083645], [-1.628433534147071, 50.998188571849006]],
    [[-1.628804844036594, 50.999094411665354], [-1.628712749058782, 50.998869742100936]],
  ]],
  ['South West', [
    [[-1.606092162566745, 50.97475763424615], [-1.619751051433103, 50.958566891040576]],
    [[-1.603075106296357, 50.97833219637941], [-1.604904704594691, 50.976164593318344]],
    [[-1.619432546227886, 50.98472207898823], [-1.619723714983771, 50.9830762720422]],
    [[-1.618980577516788, 50.98727655271801], [-1.619070856398087, 50.98676632991061]],
    [[-1.618958720929101, 50.98740007635013], [-1.618962474656326, 50.98737886201456]],
    [[-1.619540020579129, 50.987672484289455], [-1.618958720929101, 50.98740007635013]],
    [[-1.624749670665667, 50.99011354877915], [-1.6242391470279, 50.989874356702266]],
    [[-1.625364068031521, 50.99069896274061], [-1.625345427072826, 50.99065347042919]],
    [[-1.628132351616869, 50.99745378639705], [-1.628107876483447, 50.99739407413407]],
    [[-1.628305726212586, 50.99787676583073], [-1.628193158782532, 50.99760213764673]],
    [[-1.628523215864711, 50.99840736083645], [-1.628433534147071, 50.998188571849006]],
    [[-1.628804844036594, 50.999094411665354], [-1.628712749058782, 50.998869742100936]],
  ]],
]);
const CURRENT_KNOWN_ENDPOINT_REMAPS = new Map([
  ['Central & Wessex', {
    tip: [-1.602934, 50.978524],
    root: [-1.619751051433103, 50.958566891040576],
  }],
  ['South West', {
    tip: [-1.6049213, 50.9762065],
    root: [-1.619751051433103, 50.958566891040576],
  }],
]);
const CURRENT_BLACKWATER_SPUR_BBOX = {
  minX: -1.63,
  minY: 50.95,
  maxX: -1.6,
  maxY: 50.98,
};

fs.mkdirSync(OUTLINES, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a group name to a filesystem-safe slug. */
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
}

/** Load and parse a GeoJSON file relative to public/. */
function loadGeoJSON(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const abs = normalized.startsWith('data/regions/')
    ? path.join(REGIONS, normalized.slice('data/regions/'.length))
    : path.join(ROOT, 'public', normalized);
  if (!fs.existsSync(abs)) {
    console.warn(`  [skip] file not found: ${abs}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

/**
 * Build the TopoJSON for a subset of features and return the exterior arc
 * GeoJSON (MultiLineString) for that group.
 */
function groupExteriorArc(groupFeatures) {
  if (!groupFeatures.length) return null;

  const topo = topology({
    layer: { type: 'FeatureCollection', features: groupFeatures },
  });

  // mesh with (a === b) keeps only arcs on the outer boundary of the set
  // (arcs shared by exactly one polygon, i.e. not interior shared edges).
  const line = mesh(topo, topo.objects.layer, (a, b) => a === b);

  if (!line || !line.coordinates || line.coordinates.length === 0) return null;

  return {
    type: 'Feature',
    geometry: line,
    properties: {},
  };
}

function cloneFeatureWithGroup(feature, groupName) {
  return {
    ...feature,
    properties: {
      ...(feature.properties ?? {}),
      __group: groupName,
    },
  };
}

function getLineComponents(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, polygonCoordinates) {
  if (!polygonCoordinates?.length) return false;
  if (!pointInRing(point, polygonCoordinates[0])) return false;
  for (const hole of polygonCoordinates.slice(1)) {
    if (pointInRing(point, hole)) return false;
  }
  return true;
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }
  return false;
}

function pointToSegmentDistance(point, start, end) {
  const [px, py] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function pointNearRingBoundary(point, ring, epsilon = SHELL_EPSILON) {
  for (let index = 1; index < ring.length; index += 1) {
    if (pointToSegmentDistance(point, ring[index - 1], ring[index]) <= epsilon) {
      return true;
    }
  }
  return false;
}

function pointNearGeometryBoundary(point, geometry, epsilon = SHELL_EPSILON) {
  if (!geometry) return false;
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (pointNearRingBoundary(point, ring, epsilon)) {
        return true;
      }
    }
  }
  return false;
}

function pointNearReferenceComponents(point, referenceComponents, epsilon = DISSOLVE_REFERENCE_EPSILON) {
  return referenceComponents.some((component) =>
    pointNearRingBoundary(point, component, epsilon));
}

function coordinateKey(point) {
  return `${point[0].toFixed(LINE_NODE_PRECISION)},${point[1].toFixed(LINE_NODE_PRECISION)}`;
}

function buildLineGraph(geometry) {
  const components = getLineComponents(geometry);
  const edges = [];
  const adjacency = new Map();
  const nodePoints = new Map();

  const registerNode = (point) => {
    const key = coordinateKey(point);
    if (!adjacency.has(key)) adjacency.set(key, new Set());
    if (!nodePoints.has(key)) nodePoints.set(key, point);
    return key;
  };

  for (const component of components) {
    for (let index = 1; index < component.length; index += 1) {
      const start = component[index - 1];
      const end = component[index];
      if ((start[0] === end[0]) && (start[1] === end[1])) {
        continue;
      }
      const startKey = registerNode(start);
      const endKey = registerNode(end);
      const edge = {
        id: edges.length,
        startKey,
        endKey,
        start,
        end,
      };
      edges.push(edge);
      adjacency.get(startKey)?.add(edge.id);
      adjacency.get(endKey)?.add(edge.id);
    }
  }

  return {
    edges,
    adjacency,
    nodePoints,
  };
}

function rebuildComponentsFromGraph(graph, activeEdges) {
  const activeDegree = (nodeKey) =>
    [...(graph.adjacency.get(nodeKey) ?? [])].filter((edgeId) => activeEdges.has(edgeId)).length;
  const usedEdges = new Set();
  const components = [];

  const walk = (startKey, firstEdgeId) => {
    const component = [graph.nodePoints.get(startKey)];
    let currentKey = startKey;
    let edgeId = firstEdgeId;

    while (edgeId != null) {
      usedEdges.add(edgeId);
      const edge = graph.edges[edgeId];
      const nextKey = edge.startKey === currentKey ? edge.endKey : edge.startKey;
      const nextPoint = edge.startKey === currentKey ? edge.end : edge.start;
      const lastPoint = component[component.length - 1];
      if ((lastPoint[0] !== nextPoint[0]) || (lastPoint[1] !== nextPoint[1])) {
        component.push(nextPoint);
      }
      currentKey = nextKey;

      const nextEdges = [...(graph.adjacency.get(currentKey) ?? [])]
        .filter((candidate) => activeEdges.has(candidate) && !usedEdges.has(candidate));
      if (nextEdges.length !== 1) {
        break;
      }
      edgeId = nextEdges[0];
    }

    return component;
  };

  for (const [nodeKey, nodeEdges] of graph.adjacency.entries()) {
    if (activeDegree(nodeKey) === 2) continue;
    for (const edgeId of nodeEdges) {
      if (!activeEdges.has(edgeId) || usedEdges.has(edgeId)) continue;
      const component = walk(nodeKey, edgeId);
      if (component.length >= 2) {
        components.push(component);
      }
    }
  }

  for (const edge of graph.edges) {
    if (!activeEdges.has(edge.id) || usedEdges.has(edge.id)) continue;
    const component = walk(edge.startKey, edge.id);
    if (component.length >= 2) {
      components.push(component);
    }
  }

  return components;
}

function pruneCurrentSplitInteriorDeadEnds(arcFeature, splitParentShells) {
  if (!arcFeature?.geometry || splitParentShells.length === 0) {
    return arcFeature;
  }

  const graph = buildLineGraph(arcFeature.geometry);
  if (graph.edges.length === 0) {
    return arcFeature;
  }

  const activeEdges = new Set(graph.edges.map((edge) => edge.id));
  const activeDegree = (nodeKey) =>
    [...(graph.adjacency.get(nodeKey) ?? [])].filter((edgeId) => activeEdges.has(edgeId)).length;

  for (const shell of splitParentShells) {
    const queue = [];
    for (const [nodeKey, point] of graph.nodePoints.entries()) {
      if (!pointInGeometry(point, shell)) continue;
      if (pointNearGeometryBoundary(point, shell)) continue;
      if (activeDegree(nodeKey) === 1) {
        queue.push(nodeKey);
      }
    }

    while (queue.length > 0) {
      const nodeKey = queue.shift();
      const point = graph.nodePoints.get(nodeKey);
      if (!point) continue;
      if (!pointInGeometry(point, shell) || pointNearGeometryBoundary(point, shell)) continue;

      const incidentEdges = [...(graph.adjacency.get(nodeKey) ?? [])]
        .filter((edgeId) => activeEdges.has(edgeId));
      if (incidentEdges.length !== 1) {
        continue;
      }

      const edgeId = incidentEdges[0];
      activeEdges.delete(edgeId);
      const edge = graph.edges[edgeId];
      const neighborKey = edge.startKey === nodeKey ? edge.endKey : edge.startKey;
      const neighborPoint = graph.nodePoints.get(neighborKey);
      if (
        neighborPoint
        && pointInGeometry(neighborPoint, shell)
        && !pointNearGeometryBoundary(neighborPoint, shell)
        && activeDegree(neighborKey) === 1
      ) {
        queue.push(neighborKey);
      }
    }
  }

  if (activeEdges.size === graph.edges.length) {
    return arcFeature;
  }

  const kept = rebuildComponentsFromGraph(graph, activeEdges);
  if (kept.length === 0) {
    return arcFeature;
  }

  return {
    ...arcFeature,
    geometry: kept.length === 1
      ? { type: 'LineString', coordinates: kept[0] }
      : { type: 'MultiLineString', coordinates: kept },
  };
}

function filterComponentSegmentsByExclusion(component, exclusionSegments) {
  if (!exclusionSegments.length || component.length < 2) {
    return [component];
  }

  const runs = [];
  let activeRun = null;

  const segmentExcluded = (start, end) => {
    const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    return exclusionSegments.some(([left, right]) => (
      pointToSegmentDistance(midpoint, left, right) <= DISSOLVE_REFERENCE_EPSILON
      || (
        pointToSegmentDistance(start, left, right) <= DISSOLVE_REFERENCE_EPSILON
        && pointToSegmentDistance(end, left, right) <= DISSOLVE_REFERENCE_EPSILON
      )
    ));
  };

  for (let index = 1; index < component.length; index += 1) {
    const start = component[index - 1];
    const end = component[index];
    if (segmentExcluded(start, end)) {
      if (activeRun && activeRun.length >= 2) {
        runs.push(activeRun);
      }
      activeRun = null;
      continue;
    }

    if (!activeRun) {
      activeRun = [start, end];
      continue;
    }

    const last = activeRun[activeRun.length - 1];
    if ((last[0] !== start[0]) || (last[1] !== start[1])) {
      activeRun.push(start);
    }
    activeRun.push(end);
  }

  if (activeRun && activeRun.length >= 2) {
    runs.push(activeRun);
  }

  return runs.length > 0 ? runs : [component];
}

function pruneKnownCurrentSegments(arcFeature, groupName) {
  const exclusionSegments = CURRENT_KNOWN_EXCLUDED_SEGMENTS.get(groupName) ?? [];
  if (!arcFeature?.geometry || exclusionSegments.length === 0) {
    return arcFeature;
  }

  const kept = [];
  for (const component of getLineComponents(arcFeature.geometry)) {
    kept.push(...filterComponentSegmentsByExclusion(component, exclusionSegments));
  }

  if (kept.length === 0) {
    return arcFeature;
  }

  return {
    ...arcFeature,
    geometry: kept.length === 1
      ? { type: 'LineString', coordinates: kept[0] }
      : { type: 'MultiLineString', coordinates: kept },
  };
}

function rectifyKnownCurrentComponents(arcFeature, groupName) {
  const remap = CURRENT_KNOWN_ENDPOINT_REMAPS.get(groupName);
  if (!arcFeature?.geometry || !remap) {
    return arcFeature;
  }

  const kept = [];
  for (const component of getLineComponents(arcFeature.geometry)) {
    const first = component[0];
    const last = component[component.length - 1];
    const firstNearTip = pointToSegmentDistance(first, remap.tip, remap.tip) <= DISSOLVE_REFERENCE_EPSILON;
    const lastNearTip = pointToSegmentDistance(last, remap.tip, remap.tip) <= DISSOLVE_REFERENCE_EPSILON;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of component) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    const isLocalSpurComponent =
      minX >= CURRENT_BLACKWATER_SPUR_BBOX.minX
      && maxX <= CURRENT_BLACKWATER_SPUR_BBOX.maxX
      && minY >= CURRENT_BLACKWATER_SPUR_BBOX.minY
      && maxY <= CURRENT_BLACKWATER_SPUR_BBOX.maxY;

    const firstNearRoot = pointToSegmentDistance(first, remap.root, remap.root) <= DISSOLVE_REFERENCE_EPSILON;
    const lastNearRoot = pointToSegmentDistance(last, remap.root, remap.root) <= DISSOLVE_REFERENCE_EPSILON;

    if ((firstNearTip || lastNearTip || firstNearRoot || lastNearRoot) && isLocalSpurComponent) {
      continue;
    }

    if (firstNearTip || lastNearTip) {
      const adjusted = component.map((point) => [...point]);
      if (firstNearTip) {
        adjusted[0] = [...remap.root];
      }
      if (lastNearTip) {
        adjusted[adjusted.length - 1] = [...remap.root];
      }
      kept.push(adjusted);
      continue;
    }

    kept.push(component);
  }

  if (kept.length === 0) {
    return arcFeature;
  }

  return {
    ...arcFeature,
    geometry: kept.length === 1
      ? { type: 'LineString', coordinates: kept[0] }
      : { type: 'MultiLineString', coordinates: kept },
  };
}

function filterComponentSegmentsToReference(component, referenceComponents) {
  if (!referenceComponents.length || component.length < 2) {
    return [component];
  }

  const runs = [];
  let activeRun = null;

  for (let index = 1; index < component.length; index += 1) {
    const start = component[index - 1];
    const end = component[index];
    const midpoint = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ];
    const midpointNear = pointNearReferenceComponents(midpoint, referenceComponents);
    const startNear = pointNearReferenceComponents(start, referenceComponents);
    const endNear = pointNearReferenceComponents(end, referenceComponents);
    const keepSegment = midpointNear || (startNear && endNear);

    if (!keepSegment) {
      if (activeRun && activeRun.length >= 2) {
        runs.push(activeRun);
      }
      activeRun = null;
      continue;
    }

    if (!activeRun) {
      activeRun = [start, end];
      continue;
    }

    const last = activeRun[activeRun.length - 1];
    if (last[0] !== start[0] || last[1] !== start[1]) {
      activeRun.push(start);
    }
    activeRun.push(end);
  }

  if (activeRun && activeRun.length >= 2) {
    runs.push(activeRun);
  }

  return runs.length > 0 ? runs : [component];
}

function trimRunEndpointsToReference(run, referenceComponents) {
  if (!referenceComponents.length || run.length < 2) {
    return run;
  }

  let startIndex = 0;
  let endIndex = run.length - 1;

  while (
    startIndex < endIndex
    && !pointNearReferenceComponents(run[startIndex], referenceComponents)
  ) {
    startIndex += 1;
  }

  while (
    endIndex > startIndex
    && !pointNearReferenceComponents(run[endIndex], referenceComponents)
  ) {
    endIndex -= 1;
  }

  const trimmed = run.slice(startIndex, endIndex + 1);
  return trimmed.length >= 2 ? trimmed : run;
}

function pruneCurrentSplitInteriorOrphans(arcFeature, splitParentShells, dissolveReferenceFeature) {
  if (!arcFeature?.geometry) {
    return arcFeature;
  }

  const components = getLineComponents(arcFeature.geometry);
  if (!components.length) {
    return arcFeature;
  }
  const referenceComponents = getLineComponents(dissolveReferenceFeature?.geometry);

  const kept = [];
  for (const component of components) {
    const trimmedRuns =
      referenceComponents.length > 0
        ? filterComponentSegmentsToReference(component, referenceComponents)
        : [component];

    for (const run of trimmedRuns) {
      const normalizedRun =
        referenceComponents.length > 0
          ? trimRunEndpointsToReference(run, referenceComponents)
          : run;

      if (referenceComponents.length > 0) {
        const nearReferenceCount = normalizedRun.filter((point) =>
          pointNearReferenceComponents(point, referenceComponents)).length;
        if (nearReferenceCount < Math.min(2, normalizedRun.length)) {
          continue;
        }
      }

      let rejected = false;
      for (const shell of splitParentShells) {
        const allInside = normalizedRun.every((point) => pointInGeometry(point, shell));
        if (!allInside) {
          continue;
        }
        const touchesShell = normalizedRun.some((point) => pointNearGeometryBoundary(point, shell));
        if (!touchesShell) {
          rejected = true;
          break;
        }
      }
      if (!rejected) {
        kept.push(normalizedRun);
      }
    }
  }

  if (!kept.length) {
    return arcFeature;
  }

  const prunedFeature = {
    ...arcFeature,
    geometry: kept.length === 1
      ? { type: 'LineString', coordinates: kept[0] }
      : { type: 'MultiLineString', coordinates: kept },
  };

  return pruneCurrentSplitInteriorDeadEnds(prunedFeature, splitParentShells);
}

function buildPresetPreparedTopology({
  presetId,
  boardFeatures,
  wardFeatures,
  codeGroupings,
  hiddenParentCodes,
}) {
  const preparedFeatures = [];

  for (const feature of boardFeatures) {
    const boundaryCode = String(feature.properties?.boundary_code ?? '').trim();
    if (!boundaryCode) continue;
    if (presetId === 'current' && hiddenParentCodes.has(boundaryCode)) {
      continue;
    }
    const groupName = String(codeGroupings[boundaryCode] ?? '').trim();
    if (!groupName) continue;
    preparedFeatures.push(cloneFeatureWithGroup(feature, groupName));
  }

  if (presetId === 'current') {
    for (const feature of wardFeatures) {
      const groupName = String(feature.properties?.region_ref ?? '').trim();
      if (!groupName) continue;
      preparedFeatures.push(cloneFeatureWithGroup(feature, groupName));
    }
  }

  if (!preparedFeatures.length) {
    return null;
  }

  return topology({
    layer: {
      type: 'FeatureCollection',
      features: preparedFeatures,
    },
  });
}

function groupExteriorArcFromPreparedTopology(groupTopology, groupName) {
  if (!groupTopology?.objects?.layer) {
    return null;
  }

  const line = mesh(groupTopology, groupTopology.objects.layer, (a, b) => {
    const aGroup = String(a?.properties?.__group ?? '').trim();
    const bGroup = String(b?.properties?.__group ?? '').trim();

    if (a === b) {
      return aGroup === groupName;
    }

    const aMatch = aGroup === groupName;
    const bMatch = bGroup === groupName;
    return aMatch !== bMatch;
  });

  if (!line || !line.coordinates || line.coordinates.length === 0) return null;

  return {
    type: 'Feature',
    geometry: line,
    properties: {},
  };
}

function groupExteriorArcFromDissolve(groupFeatures, groupName) {
  if (!groupFeatures.length) return null;

  const polygonFeatures = [];
  for (const feature of groupFeatures) {
    const geometry = feature?.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      polygonFeatures.push({
        type: 'Feature',
        properties: { group: groupName },
        geometry,
      });
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const coordinates of geometry.coordinates) {
        polygonFeatures.push({
          type: 'Feature',
          properties: { group: groupName },
          geometry: {
            type: 'Polygon',
            coordinates,
          },
        });
      }
    }
  }

  if (!polygonFeatures.length) {
    return null;
  }

  const dissolved = dissolve(
    {
      type: 'FeatureCollection',
      features: polygonFeatures,
    },
    { propertyName: 'group' },
  );

  const exteriorLines = [];
  for (const feature of dissolved.features ?? []) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      if (geometry.coordinates[0]) {
        exteriorLines.push(geometry.coordinates[0]);
      }
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        if (polygon[0]) {
          exteriorLines.push(polygon[0]);
        }
      }
    }
  }

  if (!exteriorLines.length) {
    return null;
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'MultiLineString',
      coordinates: exteriorLines,
    },
    properties: {},
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const presets = config.presets;

// For each unique boardLayer path collect the presets that use it.
const pathToPresets = new Map();
for (const [presetId, preset] of Object.entries(presets)) {
  const boardPath = preset.boardLayer?.path;
  if (!boardPath) continue;
  if (!pathToPresets.has(boardPath)) pathToPresets.set(boardPath, []);
  pathToPresets.get(boardPath).push(presetId);
}

for (const [boardRelPath, presetIds] of pathToPresets) {
  console.log(`\n=== ${boardRelPath} (${presetIds.join(', ')}) ===`);

  const geojson = loadGeoJSON(boardRelPath);
  if (!geojson) continue;

  // Build a feature lookup keyed by boundary_code for fast group filtering.
  const byCode = new Map();
  for (const f of geojson.features) {
    const code = String(f.properties?.boundary_code ?? '').trim();
    if (code) byCode.set(code, f);
  }
  console.log(`  Loaded ${geojson.features.length} features`);

  // Archive as TopoJSON.
  const basename = path.basename(boardRelPath, '.geojson');
  const topoPath = path.join(REGIONS, `${basename}.topo.json`);
  const fullTopo = topology({ regions: geojson });
  fs.writeFileSync(topoPath, JSON.stringify(fullTopo));
  console.log(`  Saved ${path.basename(topoPath)} (${(fs.statSync(topoPath).size / 1024).toFixed(0)} KB)`);

  for (const presetId of presetIds) {
    const preset = presets[presetId];
    const codeGroupings = preset.codeGroupings ?? {};
    const regionGroups = preset.regionGroups ?? [];
    const mergedOutlineFeatures = [];

    // For the Current preset, load ward-split sub-polygons for augmentation.
    let wardSplitByRegionRef = new Map();
    if (preset.wardSplitPath) {
      const wardGeoJSON = loadGeoJSON(preset.wardSplitPath);
      if (wardGeoJSON) {
        for (const f of wardGeoJSON.features) {
          const ref = String(f.properties?.region_ref ?? '').trim();
          if (!ref) continue;
          if (!wardSplitByRegionRef.has(ref)) wardSplitByRegionRef.set(ref, []);
          wardSplitByRegionRef.get(ref).push(f);
        }
        console.log(`  Ward-split: ${wardGeoJSON.features.length} sub-polygons across ${wardSplitByRegionRef.size} groups`);
      }
    }

    const hiddenParentCodes =
      presetId === 'current'
        ? new Set(preset.wardSplitParentCodes ?? [])
        : new Set();
    const splitParentShells =
      presetId === 'current'
        ? [...CURRENT_SPLIT_PARENT_CODES]
          .map((boundaryCode) => byCode.get(boundaryCode)?.geometry ?? null)
          .filter(Boolean)
        : [];
    const preparedTopology = buildPresetPreparedTopology({
      presetId,
      boardFeatures: geojson.features,
      wardFeatures: Array.from(wardSplitByRegionRef.values()).flat(),
      codeGroupings,
      hiddenParentCodes,
    });

    // Group name → set of boundary_codes.
    const groupCodes = new Map();
    for (const [code, groupName] of Object.entries(codeGroupings)) {
      if (!groupCodes.has(groupName)) groupCodes.set(groupName, []);
      groupCodes.get(groupName).push(code);
    }

    for (const group of regionGroups) {
      const codes = groupCodes.get(group.name) ?? [];
      const mainFeatures = codes.map((c) => byCode.get(c)).filter(Boolean);
      const wardFeatures = wardSplitByRegionRef.get(group.name) ?? [];
      const allFeatures = [...mainFeatures, ...wardFeatures];

      if (!allFeatures.length) {
        console.warn(`  [skip] ${presetId} / "${group.name}": no features`);
        continue;
      }

      const arcFeature =
        (presetId === 'current'
          ? groupExteriorArcFromPreparedTopology(preparedTopology, group.name)
          : null)
        ?? groupExteriorArcFromDissolve(allFeatures, group.name)
        ?? groupExteriorArc(allFeatures);
      if (!arcFeature) {
        console.warn(`  [empty arc] ${presetId} / "${group.name}"`);
        continue;
      }
      const dissolveReferenceFeature =
        presetId === 'current'
          ? groupExteriorArcFromDissolve(allFeatures, group.name)
          : null;

      const cleanedArcFeature =
        presetId === 'current'
          ? rectifyKnownCurrentComponents(
            pruneKnownCurrentSegments(
              pruneCurrentSplitInteriorOrphans(
                arcFeature,
                splitParentShells,
                dissolveReferenceFeature,
              ),
              group.name,
            ),
            group.name,
          )
          : arcFeature;

      const outlineGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            ...cleanedArcFeature,
            properties: {
              preset: presetId,
              group: group.name,
              region_name: group.name,
              jmc_name: group.name,
              boundary_name: group.name,
            },
          },
        ],
      };

      mergedOutlineFeatures.push(outlineGeoJSON.features[0]);

      const outlineName = `${presetId}_${slug(group.name)}.geojson`;
      const outlinePath = path.join(OUTLINES, outlineName);
      fs.writeFileSync(outlinePath, JSON.stringify(outlineGeoJSON));
      console.log(`  ${outlineName} — ${mainFeatures.length} ICBs + ${wardFeatures.length} ward-split`);
    }

    const collectionOutputName = PRESET_COLLECTION_OUTPUTS[presetId];
    if (collectionOutputName && mergedOutlineFeatures.length > 0) {
      const collectionPath = path.join(REGIONS, collectionOutputName);
      fs.writeFileSync(
        collectionPath,
        JSON.stringify({
          type: 'FeatureCollection',
          features: mergedOutlineFeatures,
        }),
      );
      console.log(`  ${collectionOutputName} — merged dissolve-derived outline arcs (${mergedOutlineFeatures.length} groups)`);
    }
  }
}

console.log('\nDone.');
