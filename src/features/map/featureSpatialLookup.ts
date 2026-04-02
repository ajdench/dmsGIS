import type { FeatureLike } from 'ol/Feature';
import type { Extent } from 'ol/extent';
import type VectorSource from 'ol/source/Vector';

export function findFeatureContainingCoordinate(
  source: VectorSource | null,
  coordinate: [number, number] | null,
): FeatureLike | null {
  if (!source || !coordinate) {
    return null;
  }

  const extent: Extent = [coordinate[0], coordinate[1], coordinate[0], coordinate[1]];
  const matched =
    source.forEachFeatureIntersectingExtent(extent, (candidate) =>
      candidate.getGeometry()?.intersectsCoordinate(coordinate) ? candidate : undefined,
    ) ?? null;

  return matched as FeatureLike | null;
}
