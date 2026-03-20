import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  getActiveAssignmentLookupSource,
  getActiveScenarioOutlineLookupSource,
} from '../src/features/map/lookupSources';

describe('lookupSources', () => {
  it('prefers the live care-board source over the fallback assignment source', () => {
    const liveSource = new VectorSource();
    const fallbackSource = new VectorSource();
    const regionBoundaryLayers = new Map([
      ['careBoardBoundaries', new VectorLayer({ source: liveSource })],
    ]);

    expect(
      getActiveAssignmentLookupSource(regionBoundaryLayers, fallbackSource),
    ).toBe(liveSource);
  });

  it('falls back to the assignment lookup source when no live care-board layer exists', () => {
    const fallbackSource = new VectorSource();

    expect(
      getActiveAssignmentLookupSource(new Map(), fallbackSource),
    ).toBe(fallbackSource);
  });

  it('prefers populated live scenario outline sources for the active preset', () => {
    const liveSource = new VectorSource({
      features: [new Feature({ geometry: new Point([1, 2]) })],
    });
    const lookupSource = new VectorSource();
    const regionBoundaryLayers = new Map([
      ['pmcUnpopulatedCareBoardBoundaries', new VectorLayer({ source: liveSource })],
    ]);
    const scenarioBoundaryLookupSources = new Map([
      ['coa3a', lookupSource] as const,
    ]);

    expect(
      getActiveScenarioOutlineLookupSource(
        regionBoundaryLayers,
        scenarioBoundaryLookupSources,
        'coa3a',
      ),
    ).toBe(liveSource);
  });

  it('falls back to the preset lookup source when the live scenario layer is empty', () => {
    const liveSource = new VectorSource();
    const lookupSource = new VectorSource();
    const regionBoundaryLayers = new Map([
      ['pmcUnpopulatedCareBoardBoundaries', new VectorLayer({ source: liveSource })],
    ]);
    const scenarioBoundaryLookupSources = new Map([
      ['coa3b', lookupSource] as const,
    ]);

    expect(
      getActiveScenarioOutlineLookupSource(
        regionBoundaryLayers,
        scenarioBoundaryLookupSources,
        'coa3b',
      ),
    ).toBe(lookupSource);
  });
});
