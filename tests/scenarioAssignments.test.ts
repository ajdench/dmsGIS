import { describe, expect, it } from 'vitest';
import {
  getScenarioAssignmentCode,
  resolveScenarioAssignment,
} from '../src/lib/config/scenarioAssignments';

describe('scenario assignments', () => {
  it('maps source region name directly when no boundary-name override applies', () => {
    // Boundary-name overrides are now absorbed into codeGroupings (code-keyed).
    // resolveScenarioAssignment passes the source region name through unchanged.
    expect(
      resolveScenarioAssignment(
        'coa3b',
        'JMC Centre',
        'NHS Essex Integrated Care Board',
        'JMC_CENTRE',
      ),
    ).toEqual({
      name: 'JMC Centre',
      code: 'COA3A_JMC_CENTRE',
    });
  });

  it('normalises coa3c london district source name to a coa3b assignment code', () => {
    expect(
      resolveScenarioAssignment(
        'coa3c',
        'London District',
        'NHS Essex Integrated Care Board',
        'JMC_LONDON_DISTRICT',
      ),
    ).toEqual({
      name: 'London District',
      code: 'COA3B_LONDON_DISTRICT',
    });
  });

  it('falls back to the source code when no assignment metadata exists', () => {
    expect(getScenarioAssignmentCode('coa3a', 'JMC North', 'JMC_NORTH')).toBe(
      'JMC_NORTH',
    );
  });
});
