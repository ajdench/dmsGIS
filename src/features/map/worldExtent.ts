import type { Extent } from 'ol/extent';
import { get as getProjection, transformExtent } from 'ol/proj';

export const WHOLE_WORLD_RENDER_EXTENT_3857: Extent =
  getProjection('EPSG:3857')?.getExtent() ??
  transformExtent(
    [-180, -85, 180, 85],
    'EPSG:4326',
    'EPSG:3857',
  );

// The app's 0% zoom floor is intentionally not the literal full Mercator world.
// We keep Antarctica out of the default framed view while remaining centered on 0°.
export const DEFAULT_WORLD_FLOOR_EXTENT_3857: Extent = transformExtent(
  [-180, -72.5, 180, 72.5],
  'EPSG:4326',
  'EPSG:3857',
);

export const DEFAULT_WORLD_FLOOR_CENTER_3857: [number, number] = [0, 0];
