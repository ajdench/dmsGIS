import { describe, expect, it } from 'vitest';
import {
  applyGlobalStyleChange,
  buildInitialLabelStyles,
  buildInitialOverlayStyles,
  buildInitialRegionStyles,
  getMixedRegionColors,
  INITIAL_FACILITY_STYLE,
  updateStyleRecord,
} from '../src/prototypes/sidebarPrototype/prototypeStyleState';

describe('prototypeStyleState', () => {
  it('builds independent region style objects from the facility baseline', () => {
    const styles = buildInitialRegionStyles();
    const [firstKey, secondKey] = Object.keys(styles);

    expect(styles[firstKey]).toEqual(INITIAL_FACILITY_STYLE);
    expect(styles[secondKey]).toEqual(INITIAL_FACILITY_STYLE);
    expect(styles[firstKey]).not.toBe(styles[secondKey]);
  });

  it('clones initial label and overlay style records', () => {
    const labelStyles = buildInitialLabelStyles();
    const overlayStyles = buildInitialOverlayStyles();

    labelStyles['country-labels'].opacity = 0.9;
    overlayStyles.careBoards.opacity = 0.1;

    expect(buildInitialLabelStyles()['country-labels'].opacity).toBe(0.4);
    expect(buildInitialOverlayStyles().careBoards.opacity).toBe(1);
  });

  it('dedupes uniform region colors and returns mixed swatches only when needed', () => {
    const uniform = buildInitialRegionStyles();
    const mixed = {
      ...uniform,
      North: {
        ...uniform.North,
        color: '#123456',
      },
    };

    expect(getMixedRegionColors(uniform, 'color')).toBeUndefined();
    expect(getMixedRegionColors(mixed, 'color')).toEqual([
      { color: '#ed5151', opacity: 0.75 },
      { color: '#123456', opacity: 0.75 },
    ]);
  });

  it('broadcasts global style overrides across all region rows', () => {
    const styles = buildInitialRegionStyles();
    const next = applyGlobalStyleChange(styles, { opacity: 0.5, shape: 'diamond' });

    expect(Object.values(next).every((style) => style.opacity === 0.5)).toBe(true);
    expect(Object.values(next).every((style) => style.shape === 'diamond')).toBe(true);
    expect(styles.North.opacity).toBe(0.75);
  });

  it('updates a keyed style record immutably', () => {
    const labels = buildInitialLabelStyles();
    const next = updateStyleRecord(labels, 'major-cities', 'size', 9);

    expect(next['major-cities'].size).toBe(9);
    expect(next['country-labels']).toEqual(labels['country-labels']);
    expect(next).not.toBe(labels);
    expect(next['major-cities']).not.toBe(labels['major-cities']);
  });
});
