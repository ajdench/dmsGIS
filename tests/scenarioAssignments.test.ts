import { describe, expect, it } from 'vitest';
import {
  getScenarioAssignmentCode,
  resolveScenarioAssignment,
} from '../src/lib/config/scenarioAssignments';

describe('scenario assignments', () => {
  it('resolves coa3a boundary overrides into scenario assignments', () => {
    expect(
      resolveScenarioAssignment(
        'coa3b',
        'JMC Centre',
        'NHS Essex Integrated Care Board',
        'JMC_CENTRE',
      ),
    ).toEqual({
      name: 'COA 3a South East',
      code: 'COA3A_SOUTH_EAST',
    });
  });

  it('resolves coa3b london and east assignment codes from metadata', () => {
    expect(
      resolveScenarioAssignment(
        'coa3c',
        'London District',
        'NHS Essex Integrated Care Board',
        'JMC_LONDON_DISTRICT',
      ),
    ).toEqual({
      name: 'COA 3b London and East',
      code: 'COA3B_LONDON_EAST',
    });
  });

  it('falls back to the source code when no assignment metadata exists', () => {
    expect(getScenarioAssignmentCode('coa3a', 'JMC North', 'JMC_NORTH')).toBe(
      'JMC_NORTH',
    );
  });
});
