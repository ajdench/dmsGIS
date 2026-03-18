import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  findJmcNameAtCoordinate,
  findJmcNameForBoundarySelection,
  getBoundaryName,
} from '../src/features/map/boundarySelection';

describe('boundarySelection', () => {
  it('resolves a readable boundary name from known properties', () => {
    const feature = new Feature({
      boundary_name: 'Boundary X',
    });

    expect(getBoundaryName(feature)).toBe('Boundary X');
  });

  it('maps scenario JMC names from assignment features at a coordinate', () => {
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          jmc_name: 'JMC Centre',
          boundary_name: 'NHS Essex Integrated Care Board',
        }),
      ],
    });

    expect(findJmcNameAtCoordinate([5, 5], assignmentSource, null, 'coa3c')).toBe(
      'COA 3b London and East',
    );
  });

  it('falls back to boundary-name mapping for selected boundaries', () => {
    const feature = new Feature({
      boundary_name: 'NHS Essex Integrated Care Board',
    });

    expect(
      findJmcNameForBoundarySelection(
        feature,
        undefined,
        new Map([['NHS Essex Integrated Care Board', 'JMC Centre']]),
        null,
        null,
        'coa3c',
      ),
    ).toBe('COA 3b London and East');
  });
});
