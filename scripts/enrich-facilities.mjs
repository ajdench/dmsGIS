/**
 * enrich-facilities.mjs
 *
 * Adds ICB/LHB/SHB/NIHB boundary code fields to each facility via point-in-polygon.
 *
 * Usage:
 *   node scripts/enrich-facilities.mjs
 *
 * Inputs:
 *   public/data/facilities/facilities.geojson
 *   public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson
 *   public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson
 *
 * Outputs (in-place update):
 *   public/data/facilities/facilities.geojson
 *     → adds `icb_hb_code`      (v10 boundary_code)
 *     → adds `icb_hb_code_2026` (2026 boundary_code)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pointOnFeature } from '@turf/point-on-feature';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const FAC_PATH = process.env.FACILITIES_GEOJSON_PATH
  ? path.resolve(ROOT, process.env.FACILITIES_GEOJSON_PATH)
  : path.join(ROOT, 'public', 'data', 'facilities', 'facilities.geojson');

// ---------------------------------------------------------------------------
// Minimal ray-casting point-in-polygon.
// Handles Polygon and MultiPolygon geometries.
// ---------------------------------------------------------------------------

function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(px, py, geometry) {
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates;
    if (!pointInRing(px, py, outer)) return false;
    for (const hole of holes) {
      if (pointInRing(px, py, hole)) return false;
    }
    return true;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => {
      const [outer, ...holes] = poly;
      if (!pointInRing(px, py, outer)) return false;
      for (const hole of holes) {
        if (pointInRing(px, py, hole)) return false;
      }
      return true;
    });
  }
  return false;
}

function distanceToSegmentMeters(px, py, ax, ay, bx, by) {
  const { distanceMeters } = nearestPointOnSegment(px, py, ax, ay, bx, by);
  return distanceMeters;
}

function nearestPointOnSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const c1 = vx * wx + vy * wy;

  let nearestX = ax;
  let nearestY = ay;
  if (c1 > 0) {
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) {
      nearestX = bx;
      nearestY = by;
    } else if (c2 > 0) {
      const t = c1 / c2;
      nearestX = ax + t * vx;
      nearestY = ay + t * vy;
    }
  }

  const lonScale = 111_320 * Math.cos((py * Math.PI) / 180);
  const latScale = 111_320;
  const dx = (px - nearestX) * lonScale;
  const dy = (py - nearestY) * latScale;
  return {
    x: nearestX,
    y: nearestY,
    distanceMeters: Math.hypot(dx, dy),
  };
}

function distanceToGeometryMeters(px, py, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        const [ax, ay] = ring[index - 1];
        const [bx, by] = ring[index];
        const segmentDistance = distanceToSegmentMeters(px, py, ax, ay, bx, by);
        if (segmentDistance < minDistance) {
          minDistance = segmentDistance;
        }
      }
    }
  }

  return minDistance;
}

const NEAREST_BOUNDARY_FALLBACK_METERS = 50;
const BOUNDARY_SNAP_INSET_METERS = 25;

function pointInFeature(px, py, feature) {
  return pointInPolygon(px, py, feature.geometry);
}

function buildBoundaryCodeIndex(boundaries) {
  return new Map(boundaries.map((feature) => [feature.properties.boundary_code, feature]));
}

function distanceBetweenPointsMeters(ax, ay, bx, by) {
  const meanLatRadians = (((ay + by) / 2) * Math.PI) / 180;
  const lonScale = 111_320 * Math.cos(meanLatRadians);
  const latScale = 111_320;
  return Math.hypot((bx - ax) * lonScale, (by - ay) * latScale);
}

function findNearestBoundaryPoint(px, py, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let nearest = null;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        const [ax, ay] = ring[index - 1];
        const [bx, by] = ring[index];
        const candidate = nearestPointOnSegment(px, py, ax, ay, bx, by);
        if (!nearest || candidate.distanceMeters < nearest.distanceMeters) {
          nearest = candidate;
        }
      }
    }
  }

  return nearest;
}

function moveTowardsPoint(ax, ay, bx, by, ratio) {
  return {
    x: ax + (bx - ax) * ratio,
    y: ay + (by - ay) * ratio,
  };
}

function snapPointIntoBoundary(px, py, boundaryFeature) {
  if (pointInFeature(px, py, boundaryFeature)) {
    return {
      x: px,
      y: py,
      snapped: false,
      snapDistanceMeters: 0,
    };
  }

  const nearestBoundaryPoint = findNearestBoundaryPoint(px, py, boundaryFeature.geometry);
  if (!nearestBoundaryPoint) {
    return {
      x: px,
      y: py,
      snapped: false,
      snapDistanceMeters: 0,
    };
  }

  const [anchorX, anchorY] = pointOnFeature(boundaryFeature).geometry.coordinates;
  const boundaryToAnchorMeters = distanceBetweenPointsMeters(
    nearestBoundaryPoint.x,
    nearestBoundaryPoint.y,
    anchorX,
    anchorY,
  );
  const preferredRatio =
    boundaryToAnchorMeters > 0
      ? Math.min(BOUNDARY_SNAP_INSET_METERS / boundaryToAnchorMeters, 0.5)
      : 1;

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const mid = (low + high) / 2;
    const candidate = moveTowardsPoint(nearestBoundaryPoint.x, nearestBoundaryPoint.y, anchorX, anchorY, mid);
    if (pointInFeature(candidate.x, candidate.y, boundaryFeature)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const insideRatio = Math.min(1, high + Math.max(preferredRatio, 1e-6));
  const candidate = moveTowardsPoint(
    nearestBoundaryPoint.x,
    nearestBoundaryPoint.y,
    anchorX,
    anchorY,
    insideRatio,
  );
  const fallbackCandidate = moveTowardsPoint(nearestBoundaryPoint.x, nearestBoundaryPoint.y, anchorX, anchorY, high);
  const finalPoint = pointInFeature(candidate.x, candidate.y, boundaryFeature) ? candidate : fallbackCandidate;

  return {
    x: finalPoint.x,
    y: finalPoint.y,
    snapped: true,
    snapDistanceMeters: distanceBetweenPointsMeters(px, py, finalPoint.x, finalPoint.y),
  };
}

function applyAssignedBoundarySnaps(sourceX, sourceY, assignedCurrentBoundary, assigned2026Boundary) {
  const snappedCurrentPoint = assignedCurrentBoundary
    ? snapPointIntoBoundary(sourceX, sourceY, assignedCurrentBoundary)
    : {
        x: sourceX,
        y: sourceY,
        snapped: false,
        snapDistanceMeters: 0,
      };

  const snapped2026Point = assigned2026Boundary
    ? snapPointIntoBoundary(snappedCurrentPoint.x, snappedCurrentPoint.y, assigned2026Boundary)
    : {
        x: snappedCurrentPoint.x,
        y: snappedCurrentPoint.y,
        snapped: false,
        snapDistanceMeters: 0,
      };

  const anySnapApplied = snappedCurrentPoint.snapped || snapped2026Point.snapped;
  const snapBasis = snappedCurrentPoint.snapped
    ? snapped2026Point.snapped
      ? 'assigned_current_boundary_then_assigned_2026_boundary'
      : 'assigned_current_boundary'
    : snapped2026Point.snapped
      ? 'assigned_2026_boundary'
      : null;

  return {
    x: snapped2026Point.x,
    y: snapped2026Point.y,
    anySnapApplied,
    snapBasis,
    snapDistanceMeters: anySnapApplied
      ? distanceBetweenPointsMeters(sourceX, sourceY, snapped2026Point.x, snapped2026Point.y)
      : null,
    snappedCurrentPoint,
    snapped2026Point,
  };
}

/**
 * Returns the `boundary_code` of the first boundary polygon that contains [px, py].
 * Returns null if no polygon contains the point (e.g. offshore facility snapped to coast).
 */
function findBoundaryCode(px, py, boundaries) {
  for (const feature of boundaries) {
    if (pointInPolygon(px, py, feature.geometry)) {
      return feature.properties.boundary_code;
    }
  }

  let nearestCode = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const feature of boundaries) {
    const boundaryDistance = distanceToGeometryMeters(px, py, feature.geometry);
    if (boundaryDistance < nearestDistance) {
      nearestDistance = boundaryDistance;
      nearestCode = feature.properties.boundary_code;
    }
  }

  if (nearestDistance <= NEAREST_BOUNDARY_FALLBACK_METERS) {
    return nearestCode;
  }

  return null;
}

function main() {
  console.log('=== enrich-facilities ===');

  const facilities = JSON.parse(fs.readFileSync(FAC_PATH, 'utf8'));
  const v10 = JSON.parse(
    fs.readFileSync(path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'), 'utf8'),
  );
  const bnd2026 = JSON.parse(
    fs.readFileSync(path.join(REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'), 'utf8'),
  );

  console.log(`Facilities: ${facilities.features.length}`);
  console.log(`v10 boundaries: ${v10.features.length}`);
  console.log(`2026 boundaries: ${bnd2026.features.length}`);

  const boundaryCodeIndex10 = buildBoundaryCodeIndex(v10.features);
  const boundaryCodeIndex2026 = buildBoundaryCodeIndex(bnd2026.features);

  let matched10 = 0;
  let matched2026 = 0;
  let missed10 = 0;
  let missed2026 = 0;
  let snappedIntoAssignedCurrentBoundary = 0;
  let snappedIntoAssigned2026Boundary = 0;

  facilities.features = facilities.features.map((facility) => {
    const [currentX, currentY] = facility.geometry.coordinates;
    const hasReviewedSnapMetadata =
      facility.properties.snapped_to_land === true &&
      typeof facility.properties.lon_original === 'number' &&
      typeof facility.properties.lat_original === 'number';
    const sourceX =
      typeof facility.properties.lon_original === 'number' ? facility.properties.lon_original : currentX;
    const sourceY =
      typeof facility.properties.lat_original === 'number' ? facility.properties.lat_original : currentY;

    const code10 =
      facility.properties.icb_hb_code ??
      (hasReviewedSnapMetadata ? findBoundaryCode(currentX, currentY, v10.features) : null) ??
      findBoundaryCode(sourceX, sourceY, v10.features) ??
      findBoundaryCode(currentX, currentY, v10.features);

    const assignedCurrentBoundary = code10 ? boundaryCodeIndex10.get(code10) ?? null : null;
    const initialCurrentSnap = assignedCurrentBoundary
      ? snapPointIntoBoundary(sourceX, sourceY, assignedCurrentBoundary)
      : {
          x: sourceX,
          y: sourceY,
          snapped: false,
          snapDistanceMeters: 0,
        };

    if (initialCurrentSnap.snapped) {
      snappedIntoAssignedCurrentBoundary += 1;
    }

    const postCurrentSnapX = initialCurrentSnap.x;
    const postCurrentSnapY = initialCurrentSnap.y;
    const code2026 =
      findBoundaryCode(postCurrentSnapX, postCurrentSnapY, bnd2026.features) ??
      facility.properties.icb_hb_code_2026 ??
      null;
    const assigned2026Boundary = code2026 ? boundaryCodeIndex2026.get(code2026) ?? null : null;
    const snapResult = applyAssignedBoundarySnaps(sourceX, sourceY, assignedCurrentBoundary, assigned2026Boundary);

    if (snapResult.snapped2026Point.snapped) {
      snappedIntoAssigned2026Boundary += 1;
    }

    const finalX = snapResult.x;
    const finalY = snapResult.y;

    if (code10) {
      matched10++;
    } else {
      missed10++;
      const name = facility.properties.name ?? facility.properties.id;
      console.warn(`  [miss v10]  ${name} at [${sourceX.toFixed(4)}, ${sourceY.toFixed(4)}]`);
    }

    if (code2026) {
      matched2026++;
    } else {
      missed2026++;
      const name = facility.properties.name ?? facility.properties.id;
      console.warn(`  [miss 2026] ${name} at [${postCurrentSnapX.toFixed(4)}, ${postCurrentSnapY.toFixed(4)}]`);
    }

    return {
      ...facility,
      geometry: {
        ...facility.geometry,
        coordinates: [finalX, finalY],
      },
      properties: {
        ...facility.properties,
        icb_hb_code: code10 ?? null,
        icb_hb_code_2026: code2026 ?? null,
        lon_original: snapResult.anySnapApplied ? sourceX : null,
        lat_original: snapResult.anySnapApplied ? sourceY : null,
        snapped_to_land: snapResult.anySnapApplied ? true : null,
        snap_distance_m: snapResult.snapDistanceMeters,
        snap_basis: snapResult.snapBasis,
      },
    };
  });

  fs.writeFileSync(FAC_PATH, JSON.stringify(facilities, null, 2));

  console.log(`\nv10:   ${matched10} matched, ${missed10} missed`);
  console.log(`2026:  ${matched2026} matched, ${missed2026} missed`);
  console.log(`snapped into assigned current boundary: ${snappedIntoAssignedCurrentBoundary}`);
  console.log(`snapped into assigned 2026 boundary: ${snappedIntoAssigned2026Boundary}`);
  console.log('\nDone.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export {
  NEAREST_BOUNDARY_FALLBACK_METERS,
  BOUNDARY_SNAP_INSET_METERS,
  buildBoundaryCodeIndex,
  distanceToGeometryMeters,
  distanceToSegmentMeters,
  distanceBetweenPointsMeters,
  findBoundaryCode,
  findNearestBoundaryPoint,
  nearestPointOnSegment,
  pointInPolygon,
  pointInFeature,
  pointInRing,
  snapPointIntoBoundary,
  applyAssignedBoundarySnaps,
};
