import { describe, expect, it } from 'vitest';
import {
  buildCombinedPracticeCatalog,
  getCombinedPracticeColorFamily,
  buildDefaultCombinedPracticeStyles,
  formatCombinedPracticeDisplayName,
} from '../src/lib/combinedPractices';

describe('combinedPractices', () => {
  it('builds only true open combined-practice defaults in alphabetical display order', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Portsmouth Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        default_visible: 1,
      },
      {
        name: 'Nelson Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        default_visible: 1,
      },
      {
        name: 'Abbey Wood Medical Centre',
        combined_practice: 'Abbey Wood Medical Centre',
        default_visible: 1,
      },
      {
        name: 'Closed Practice A',
        combined_practice: 'Closed Combined Medical Practice',
        default_visible: 0,
      },
      {
        name: 'Closed Practice B',
        combined_practice: 'Closed Combined Medical Practice',
        default_visible: 0,
      },
      {
        name: 'Bassingbourn Medical Centre',
        combined_practice: 'Bassingbourn Combined Medical Practice',
        default_visible: 1,
      },
      {
        name: 'Wyton Medical Centre',
        combined_practice: 'Bassingbourn Combined Medical Practice',
        default_visible: 1,
      },
    ]);

    expect(styles.map((style) => style.name)).toEqual([
      'Bassingbourn Combined Medical Practice',
      'Portsmouth Combined Medical Practice',
    ]);
    expect(styles.map((style) => style.displayName)).toEqual([
      'Bassingbourn',
      'Portsmouth',
    ]);
    expect(styles.every((style) => style.visible)).toBe(true);
    expect(new Set(styles.map((style) => style.borderColor)).size).toBe(2);
  });

  it('formats combined-practice display names by dropping the shared suffix', () => {
    expect(
      formatCombinedPracticeDisplayName('Portsmouth Combined Medical Practice'),
    ).toBe('Portsmouth');
    expect(formatCombinedPracticeDisplayName(null)).toBeNull();
  });

  it('builds a combined-practice catalog with open-region membership only', () => {
    const catalog = buildCombinedPracticeCatalog([
      {
        name: 'Portsmouth Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        default_visible: 1,
      },
      {
        name: 'Nelson Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        default_visible: 1,
      },
      {
        name: 'Thorney Island Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'South West',
        default_visible: 1,
      },
      {
        name: 'Closed Practice A',
        combined_practice: 'Closed Combined Medical Practice',
        region: 'North',
        default_visible: 0,
      },
      {
        name: 'Closed Practice B',
        combined_practice: 'Closed Combined Medical Practice',
        region: 'East',
        default_visible: 0,
      },
    ]);

    expect(catalog).toEqual([
      {
        name: 'Portsmouth Combined Medical Practice',
        displayName: 'Portsmouth',
        regions: ['London & South', 'South West'],
      },
    ]);
  });

  it('avoids the same colour family as the parent PMC point colour by default', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Portsmouth Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Nelson Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Clyde Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
      {
        name: 'Devonport Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
    ]);

    const portsmouth = styles.find(
      (style) => style.name === 'Portsmouth Combined Medical Practice',
    );
    const stonehouse = styles.find(
      (style) => style.name === 'Stonehouse Combined Medical Practice',
    );

    expect(portsmouth).toBeDefined();
    expect(stonehouse).toBeDefined();
    expect(getCombinedPracticeColorFamily(portsmouth!.borderColor)).not.toBe(
      getCombinedPracticeColorFamily('#419632'),
    );
    expect(getCombinedPracticeColorFamily(stonehouse!.borderColor)).not.toBe(
      getCombinedPracticeColorFamily('#4862b8'),
    );
  });

  it('also avoids near-blue defaults when both point and parent region are blue', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Marchwood Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Winchester Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Worthy Down Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
    ]);

    const winchester = styles.find(
      (style) => style.name === 'Winchester Combined Medical Practice',
    );

    expect(winchester).toBeDefined();
    expect(getCombinedPracticeColorFamily('#149ece')).toBe('blue');
    expect(getCombinedPracticeColorFamily(winchester!.borderColor)).not.toBe(
      'blue',
    );
  });

  it('separates same-region combined practices from each other by default', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Portsmouth Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Nelson Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Aldershot Medical Centre',
        combined_practice: 'Aldershot Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Aldershot Garrison Medical Centre',
        combined_practice: 'Aldershot Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Blandford Medical Centre',
        combined_practice: 'Blandford Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Bovington Medical Centre',
        combined_practice: 'Blandford Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
    ]);

    const families = styles.map((style) => getCombinedPracticeColorFamily(style.borderColor));

    expect(new Set(styles.map((style) => style.borderColor)).size).toBe(3);
    expect(families).not.toContain('green');
    expect(new Set(families).size).toBe(3);
  });

  it('applies the Catterick palette step override to avoid the green cluster', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Barrow-In-Furness Medical Centre',
        combined_practice: 'Catterick Combined Medical Practice',
        region: 'North',
        point_color_hex: '#a7c636',
        default_visible: 1,
      },
      {
        name: 'Catterick Medical Centre',
        combined_practice: 'Catterick Combined Medical Practice',
        region: 'North',
        point_color_hex: '#a7c636',
        default_visible: 1,
      },
      {
        name: 'Aldershot Medical Centre',
        combined_practice: 'Aldershot Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
      {
        name: 'Bassingbourn Medical Centre',
        combined_practice: 'Bassingbourn Combined Medical Practice',
        region: 'East',
        point_color_hex: '#fc921f',
        default_visible: 1,
      },
      {
        name: 'Wyton Medical Centre',
        combined_practice: 'Bassingbourn Combined Medical Practice',
        region: 'East',
        point_color_hex: '#fc921f',
        default_visible: 1,
      },
      {
        name: 'Aldershot Garrison Medical Centre',
        combined_practice: 'Aldershot Combined Medical Practice',
        region: 'London & South',
        point_color_hex: '#419632',
        default_visible: 1,
      },
    ]);

    const catterick = styles.find(
      (style) => style.name === 'Catterick Combined Medical Practice',
    );

    expect(catterick).toBeDefined();
    expect(getCombinedPracticeColorFamily(catterick!.borderColor)).not.toBe(
      'green',
    );
    expect(getCombinedPracticeColorFamily(catterick!.borderColor)).not.toBe(
      getCombinedPracticeColorFamily('#a7c636'),
    );
  });

  it('steps Stonehouse out of the blue-on-blue context', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Marchwood Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Winchester Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Worthy Down Medical Centre',
        combined_practice: 'Winchester Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Bickleigh Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
      {
        name: 'Stonehouse Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        region: 'South West',
        point_color_hex: '#149ece',
        default_visible: 1,
      },
    ]);

    const stonehouse = styles.find(
      (style) => style.name === 'Stonehouse Combined Medical Practice',
    );

    expect(stonehouse).toBeDefined();
    expect(getCombinedPracticeColorFamily(stonehouse!.borderColor)).toBe(
      'pink',
    );
    expect(stonehouse!.borderColor).toBe('#db2777');
  });

  it('uses warm overrides for East and West of Scotland against the Scotland blue', () => {
    const styles = buildDefaultCombinedPracticeStyles([
      {
        name: 'Condor Medical Centre',
        combined_practice: 'East of Scotland Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
      {
        name: 'Leuchars Medical Centre',
        combined_practice: 'East of Scotland Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
      {
        name: 'Kentigern House Medical Centre',
        combined_practice: 'West of Scotland Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
      {
        name: 'Neptune Medical Centre',
        combined_practice: 'West of Scotland Combined Medical Practice',
        region: 'Scotland & Northern Ireland',
        point_color_hex: '#4862b8',
        default_visible: 1,
      },
    ]);

    const east = styles.find(
      (style) => style.name === 'East of Scotland Combined Medical Practice',
    );
    const west = styles.find(
      (style) => style.name === 'West of Scotland Combined Medical Practice',
    );

    expect(east).toBeDefined();
    expect(west).toBeDefined();
    expect(east!.borderColor).toBe('#e11d48');
    expect(west!.borderColor).toBe('#f59e0b');
    expect(getCombinedPracticeColorFamily(east!.borderColor)).not.toBe('blue');
    expect(getCombinedPracticeColorFamily(west!.borderColor)).not.toBe('blue');
  });
});
