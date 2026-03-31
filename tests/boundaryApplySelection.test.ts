import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { applyBoundarySelection } from '../src/features/map/boundarySelection';

describe('applyBoundarySelection', () => {
  it('clears selection state when no boundary feature is provided', () => {
    const selectedBoundaryLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Polygon([[
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ]]),
          }),
        ],
      }),
    });
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Polygon([[
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ]]),
          }),
        ],
      }),
    });

    const result = applyBoundarySelection({
      feature: null,
      selectedBoundaryLayer,
      selectedJmcBoundaryLayer,
      assignmentByBoundaryName: new Map(),
      assignmentSource: null,
      boundarySource: null,
      activeViewPreset: 'current',
    });

    expect(result).toEqual({
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
        scenarioRegionId: null,
      },
    });
    expect(selectedBoundaryLayer.getSource()?.getFeatures()).toHaveLength(0);
    expect(selectedJmcBoundaryLayer.getSource()?.getFeatures()).toHaveLength(0);
  });

  it('sets selected boundary and derived JMC state from the clicked feature', () => {
    const selectedBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const feature = new Feature({
      boundary_name: 'NHS Essex Integrated Care Board',
      boundary_code: 'E54000065',
      geometry: new Polygon([[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ]]),
    });

    const result = applyBoundarySelection({
      feature,
      coordinate: [5, 5],
      selectedBoundaryLayer,
      selectedJmcBoundaryLayer,
      assignmentByBoundaryName: new Map([['NHS Essex Integrated Care Board', 'JMC Centre']]),
      assignmentSource: null,
      boundarySource: null,
      activeViewPreset: 'coa3c',
    });

    expect(result).toEqual({
      boundaryName: 'NHS Essex Integrated Care Board',
      jmcName: 'COA 3b London and East',
      scenarioRegionId: null,
      selection: {
        facilityIds: [],
        boundaryName: 'NHS Essex Integrated Care Board',
        jmcName: 'COA 3b London and East',
        scenarioRegionId: null,
      },
    });
    expect(selectedBoundaryLayer.getSource()?.getFeatures()).toHaveLength(1);
    expect(selectedJmcBoundaryLayer.getSource()?.getFeatures()).toHaveLength(0);
  });
});
