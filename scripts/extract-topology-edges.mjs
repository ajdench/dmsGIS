/**
 * extract-topology-edges.mjs
 *
 * Reads the pre-built TopoJSON archives for the v10 and 2026 boundary files
 * and extracts a set of annotated internal boundary edges for each.
 *
 * Every arc in the topology is either:
 *   - Internal: shared between two adjacent polygons (left_code + right_code)
 *   - External: belongs to only one polygon (coastal / national boundary)
 *
 * Output GeoJSON files contain LineString features for ALL arcs:
 *   - Internal arcs carry: left_code, right_code, left_type, right_type
 *   - External (coastal) arcs carry: left_code, right_code: null, left_type, right_type: null
 *
 * The overlay renderer filters to internal arcs (right_code !== null) for
 * default display.  External arcs are retained in the file for future
 * dynamic region-assignment use (Playground / dissolve boundaries).
 *
 * Outputs
 *   public/data/regions/UK_ICB_LHB_v10_topology_edges.geojson
 *   public/data/regions/UK_Health_Board_2026_topology_edges.geojson
 *
 * Usage
 *   node scripts/extract-topology-edges.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');

// ---------------------------------------------------------------------------
// Core extraction
// ---------------------------------------------------------------------------

/**
 * Recursively flatten all arc references from a TopoJSON geometry's arcs field
 * into a flat array of arc indices (canonical, unsigned — reversed arcs are ~idx).
 */
function collectArcIndices(arcsField) {
  const indices = [];

  function walk(node) {
    if (typeof node === 'number') {
      // Canonical index: negative references are bitwise-NOT (TopoJSON convention)
      indices.push(node < 0 ? ~node : node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    }
  }

  walk(arcsField);
  return indices;
}

/**
 * Decode a raw TopoJSON arc.
 *
 * Supports both:
 * - untransformed arcs already stored as lon/lat coordinates
 * - transformed arcs using TopoJSON delta encoding plus scale/translate
 *
 * Returns the arc as a GeoJSON coordinate array.
 */
export function decodeArc(rawArc, transform = null) {
  if (!transform) {
    return rawArc;
  }

  const [scaleX, scaleY] = transform.scale;
  const [translateX, translateY] = transform.translate;

  let x = 0;
  let y = 0;

  return rawArc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scaleX + translateX, y * scaleY + translateY];
  });
}

function getEndpointKey(coord) {
  return `${coord[0]},${coord[1]}`;
}

function getInternalPairKey(properties) {
  if (!properties?.internal) return null;
  const codes = [properties.left_code, properties.right_code]
    .map((value) => String(value ?? ''))
    .sort();
  const types = [properties.left_type, properties.right_type]
    .map((value) => String(value ?? ''))
    .sort();
  return `${codes.join('|')}::${types.join('|')}`;
}

function cloneFeature(feature) {
  return {
    type: 'Feature',
    geometry: {
      type: feature.geometry.type,
      coordinates: feature.geometry.coordinates.map((coord) => [...coord]),
    },
    properties: { ...feature.properties },
  };
}

function orientCoordinates(coords, startKey) {
  if (getEndpointKey(coords[0]) === startKey) {
    return coords.map((coord) => [...coord]);
  }
  const reversed = coords.slice().reverse();
  if (getEndpointKey(reversed[0]) === startKey) {
    return reversed.map((coord) => [...coord]);
  }
  return null;
}

function getExternalEndpointPairKey(feature) {
  if (feature.properties?.internal || feature.geometry?.type !== 'LineString') {
    return null;
  }

  const coords = feature.geometry.coordinates;
  if (coords.length < 2) return null;

  const startKey = getEndpointKey(coords[0]);
  const endKey = getEndpointKey(coords[coords.length - 1]);
  return startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
}

function getDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function findNearestSegment(segments, unused, anchor, tolerance) {
  let best = null;

  for (const id of unused) {
    const segment = segments[id];
    const startDistance = getDistance(anchor, segment.coords[0]);
    const endDistance = getDistance(anchor, segment.coords[segment.coords.length - 1]);
    const reverse = endDistance < startDistance;
    const distance = reverse ? endDistance : startDistance;

    if (distance > tolerance) continue;
    if (!best || distance < best.distance) {
      best = { id, reverse, distance };
    }
  }

  return best;
}

/**
 * Some clipped/simplified borders survive in the TopoJSON archive as mirrored
 * one-sided arcs rather than one shared internal arc. When two external
 * LineStrings have the same endpoints but belong to different polygons, they
 * represent the same shared border and can be promoted back to one internal
 * edge before the normal segment-chaining pass.
 */
export function reconcileMirroredExternalEdges(features) {
  const passthrough = [];
  const groups = new Map();

  for (const feature of features) {
    const key = getExternalEndpointPairKey(feature);
    if (!key) {
      passthrough.push(cloneFeature(feature));
      continue;
    }

    const list = groups.get(key) ?? [];
    list.push(cloneFeature(feature));
    groups.set(key, list);
  }

  const reconciled = [...passthrough];

  groups.forEach((groupFeatures) => {
    if (
      groupFeatures.length === 2 &&
      groupFeatures[0].properties.left_code !== groupFeatures[1].properties.left_code
    ) {
      const [leftFeature, rightFeature] = groupFeatures;
      const preferredGeometryFeature =
        leftFeature.geometry.coordinates.length >= rightFeature.geometry.coordinates.length
          ? leftFeature
          : rightFeature;

      reconciled.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: preferredGeometryFeature.geometry.coordinates.map((coord) => [...coord]),
        },
        properties: {
          left_code: leftFeature.properties.left_code ?? null,
          right_code: rightFeature.properties.left_code ?? null,
          left_type: leftFeature.properties.left_type ?? null,
          right_type: rightFeature.properties.left_type ?? null,
          internal: true,
        },
      });
      return;
    }

    reconciled.push(...groupFeatures);
  });

  return reconciled;
}

/**
 * Merge contiguous internal edge segments that belong to the same boundary pair.
 * This reduces visibly broken shared borders where the TopoJSON archive emitted
 * many tiny arcs for one logical border (notably some Welsh LHB-LHB boundaries).
 */
export function mergeConnectedEdgeFeatures(features) {
  const welshGapBridgeTolerance = 0.11;
  const passthrough = [];
  const grouped = new Map();

  for (const feature of features) {
    const pairKey = getInternalPairKey(feature.properties);
    if (!pairKey || feature.geometry?.type !== 'LineString') {
      passthrough.push(cloneFeature(feature));
      continue;
    }

    const list = grouped.get(pairKey) ?? [];
    list.push(cloneFeature(feature));
    grouped.set(pairKey, list);
  }

  const merged = [...passthrough];

  grouped.forEach((groupFeatures) => {
    const segments = groupFeatures.map((feature, index) => ({
      id: index,
      feature,
      coords: feature.geometry.coordinates,
    }));

    const endpointMap = new Map();
    for (const segment of segments) {
      const startKey = getEndpointKey(segment.coords[0]);
      const endKey = getEndpointKey(segment.coords[segment.coords.length - 1]);
      if (!endpointMap.has(startKey)) endpointMap.set(startKey, []);
      if (!endpointMap.has(endKey)) endpointMap.set(endKey, []);
      endpointMap.get(startKey).push(segment.id);
      endpointMap.get(endKey).push(segment.id);
    }

    const unused = new Set(segments.map((segment) => segment.id));

    const buildChain = (seedId) => {
      const seed = segments[seedId];
      let coords = seed.coords.map((coord) => [...coord]);
      unused.delete(seedId);

      const extend = (fromStart) => {
        while (true) {
          const anchor = fromStart ? coords[0] : coords[coords.length - 1];
          const anchorKey = getEndpointKey(anchor);
          const candidateIds = (endpointMap.get(anchorKey) ?? []).filter((id) => unused.has(id));
          let nextSegment = null;
          let oriented = null;

          if (candidateIds.length === 1) {
            nextSegment = segments[candidateIds[0]];
            oriented = orientCoordinates(nextSegment.coords, anchorKey);
          } else if (
            seed.feature.properties?.left_type === 'LHB' ||
            seed.feature.properties?.right_type === 'LHB'
          ) {
            const nearest = findNearestSegment(
              segments,
              unused,
              anchor,
              welshGapBridgeTolerance,
            );
            if (nearest) {
              nextSegment = segments[nearest.id];
              oriented = nearest.reverse
                ? nextSegment.coords.slice().reverse().map((coord) => [...coord])
                : nextSegment.coords.map((coord) => [...coord]);
            }
          }

          if (!nextSegment || !oriented) {
            break;
          }

          unused.delete(nextSegment.id);
          const sharesEndpoint = getEndpointKey(oriented[0]) === anchorKey;
          if (fromStart) {
            coords = sharesEndpoint
              ? oriented.slice(0, -1).reverse().concat(coords)
              : oriented.slice().reverse().concat(coords);
          } else {
            coords = sharesEndpoint
              ? coords.concat(oriented.slice(1))
              : coords.concat(oriented);
          }
        }
      };

      extend(true);
      extend(false);

      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: { ...seed.feature.properties },
      };
    };

    while (unused.size > 0) {
      const [seedId] = unused;
      merged.push(buildChain(seedId));
    }
  });

  return merged;
}

/**
 * Extract annotated edge features from a pre-built TopoJSON file.
 */
function extractEdges(topoPath) {
  const topo = JSON.parse(fs.readFileSync(topoPath, 'utf-8'));
  const objectKey = Object.keys(topo.objects)[0];
  const geometries = topo.objects[objectKey].geometries;

  // Build arc → [{code, type}] map.
  const arcRefs = new Map(); // arcIndex → [{code, type}]

  for (const geom of geometries) {
    const code = String(geom.properties.boundary_code ?? '');
    const type = String(geom.properties.boundary_type ?? '');

    const indices = collectArcIndices(geom.arcs ?? []);
    for (const idx of indices) {
      if (!arcRefs.has(idx)) arcRefs.set(idx, []);
      arcRefs.get(idx).push({ code, type });
    }
  }

  // Build feature collection.
  const features = [];

  arcRefs.forEach((refs, arcIdx) => {
    const coords = decodeArc(topo.arcs[arcIdx], topo.transform ?? null);
    if (!coords || coords.length < 2) return;

    const left = refs[0] ?? null;
    const right = refs.length >= 2 ? refs[1] : null;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        left_code: left?.code ?? null,
        right_code: right?.code ?? null,
        left_type: left?.type ?? null,
        right_type: right?.type ?? null,
        internal: right !== null,
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features: mergeConnectedEdgeFeatures(reconcileMirroredExternalEdges(features)),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const SOURCES = [
  {
    topo: path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json'),
    out: path.join(REGIONS, 'UK_ICB_LHB_v10_topology_edges.geojson'),
    label: 'v10',
  },
  {
    topo: path.join(REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json'),
    out: path.join(REGIONS, 'UK_Health_Board_2026_topology_edges.geojson'),
    label: '2026',
  },
];

export async function main() {
  for (const { topo, out, label } of SOURCES) {
    if (!fs.existsSync(topo)) {
      console.warn(`[skip] TopoJSON not found: ${topo}`);
      continue;
    }

    console.log(`[${label}] Extracting edges from ${path.basename(topo)}...`);
    const fc = extractEdges(topo);
    const internal = fc.features.filter((f) => f.properties.internal).length;
    const external = fc.features.length - internal;
    console.log(`  Total arcs: ${fc.features.length} (${internal} internal, ${external} external/coastal)`);

    fs.writeFileSync(out, JSON.stringify(fc));
    console.log(`  → ${path.basename(out)}`);
  }

  console.log('Done.');
}

const entryUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (entryUrl === import.meta.url) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
