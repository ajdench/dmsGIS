import { readFileSync, writeFileSync } from 'node:fs';

const boardsPath =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';
const facilitiesPath = 'public/data/facilities/facilities.geojson';

const boards = JSON.parse(readFileSync(boardsPath, 'utf8'));
const facilities = JSON.parse(readFileSync(facilitiesPath, 'utf8'));

const facilityPoints = facilities.features
  .map((feature) => feature?.geometry?.coordinates)
  .filter(
    (coordinates) =>
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      Number.isFinite(coordinates[0]) &&
      Number.isFinite(coordinates[1]),
  );

for (const feature of boards.features) {
  const geometry = feature?.geometry;
  const isPopulated =
    geometry &&
    facilityPoints.some((point) => geometryContainsPoint(geometry, point));

  feature.properties = {
    ...feature.properties,
    is_populated: Boolean(isPopulated),
  };
}

writeFileSync(boardsPath, `${JSON.stringify(boards)}\n`);

function geometryContainsPoint(geometry, point) {
  if (!geometry || !Array.isArray(point)) {
    return false;
  }

  if (geometry.type === 'Polygon') {
    return polygonContainsPoint(geometry.coordinates, point);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) =>
      polygonContainsPoint(polygon, point),
    );
  }

  return false;
}

function polygonContainsPoint(polygon, point) {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return false;
  }

  if (!ringContainsPoint(polygon[0], point)) {
    return false;
  }

  for (let index = 1; index < polygon.length; index += 1) {
    if (ringContainsPoint(polygon[index], point)) {
      return false;
    }
  }

  return true;
}

function ringContainsPoint(ring, point) {
  let inside = false;
  const [x, y] = point;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}
