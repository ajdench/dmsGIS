import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { ViewPresetId } from '../../types';

export function getActiveAssignmentLookupSource(
  regionBoundaryLayers: Map<string, VectorLayer<VectorSource>>,
  fallbackAssignmentSource: VectorSource | null,
): VectorSource | null {
  return regionBoundaryLayers.get('careBoardBoundaries')?.getSource() ?? fallbackAssignmentSource;
}

export function getActiveScenarioOutlineLookupSource(
  regionBoundaryLayers: Map<string, VectorLayer<VectorSource>>,
  scenarioBoundaryLookupSources: Map<ViewPresetId, VectorSource>,
  activeViewPreset: ViewPresetId,
): VectorSource | null {
  const liveScenarioBoundarySource = regionBoundaryLayers
    .get('pmcUnpopulatedCareBoardBoundaries')
    ?.getSource();

  if (liveScenarioBoundarySource && liveScenarioBoundarySource.getFeatures().length > 0) {
    return liveScenarioBoundarySource;
  }

  return scenarioBoundaryLookupSources.get(activeViewPreset) ?? null;
}
