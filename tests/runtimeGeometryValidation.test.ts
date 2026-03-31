import { describe, expect, it } from 'vitest';
import { main as validateRuntimeGeometryFamily } from '../scripts/validate-runtime-geometry-family.mjs';

describe('runtime geometry validation', () => {
  it('accepts the locked shipped geometry family', () => {
    expect(() => validateRuntimeGeometryFamily()).not.toThrow();
  }, 120000);
});
