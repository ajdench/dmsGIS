import { describe, expect, it, vi } from 'vitest';
import { buildOverlayPanelRows } from '../src/features/groups/overlayPanelFields';
import type { OverlayLayerStyle } from '../src/types';

function createLayer(overrides: Partial<OverlayLayerStyle> = {}): OverlayLayerStyle {
  return {
    id: 'englandIcb',
    name: '2026 NHS England ICBs',
    path: 'data/regions/UK_Health_Board_2026_topology_edges.geojson',
    family: 'englandIcb',
    visible: false,
    opacity: 0.5,
    borderVisible: true,
    borderColor: '#8f8f8f',
    borderWidth: 1,
    borderOpacity: 0.35,
    swatchColor: '#8f8f8f',
    ...overrides,
  };
}

describe('overlayPanelFields', () => {
  it('uses Fill and Border section header toggles instead of a redundant Visible field', () => {
    const rows = buildOverlayPanelRows({
      layers: [createLayer()],
      setOverlayLayerVisibility: vi.fn(),
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility: vi.fn(),
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth: vi.fn(),
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    const [fillSection, borderSection] = rows[0].sections;
    expect(rows[0].visibility.state).toBe('mixed');
    expect(fillSection.title).toBe('Fill');
    expect(fillSection.enabledState).toBe('off');
    expect(fillSection.fields.map((field) => field.label)).toEqual([
      'Colour',
      'Opacity',
    ]);
    expect(borderSection.title).toBe('Border');
    expect(borderSection.enabledState).toBe('on');
    expect(borderSection.fields.map((field) => field.label)).toEqual([
      'Colour',
      'Thickness',
      'Opacity',
    ]);
  });

  it('wires Border thickness changes to overlay border-width state', () => {
    const setOverlayLayerBorderWidth = vi.fn();
    const rows = buildOverlayPanelRows({
      layers: [createLayer({ borderVisible: false, borderWidth: 1.5 })],
      setOverlayLayerVisibility: vi.fn(),
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility: vi.fn(),
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth,
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    const borderSection = rows[0].sections[1];
    expect(borderSection.enabledState).toBe('off');
    borderSection.onEnabledChange?.(true);

    const thicknessField = borderSection.fields[1];
    if (thicknessField.kind !== 'slider') {
      throw new Error('Expected thickness field to be a slider');
    }

    thicknessField.onChange(2.5);
    expect(setOverlayLayerBorderWidth).toHaveBeenCalledWith('englandIcb', 2.5);
  });

  it('toggles both fill and border from the row-level Ox button', () => {
    const setOverlayLayerVisibility = vi.fn();
    const setOverlayLayerBorderVisibility = vi.fn();
    const rows = buildOverlayPanelRows({
      layers: [createLayer({ visible: false, borderVisible: true })],
      setOverlayLayerVisibility,
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility,
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth: vi.fn(),
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    expect(rows[0].visibility.state).toBe('mixed');
    rows[0].visibility.onChange(true);

    expect(setOverlayLayerVisibility).toHaveBeenCalledWith('englandIcb', true);
    expect(setOverlayLayerBorderVisibility).toHaveBeenCalledWith(
      'englandIcb',
      true,
    );
  });

  it('wraps both scenario and Current England ICB labels onto two lines', () => {
    const rows = buildOverlayPanelRows({
      layers: [
        createLayer(),
        createLayer({
          name: 'Pre-2026 NHS England ICBs',
        }),
      ],
      setOverlayLayerVisibility: vi.fn(),
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility: vi.fn(),
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth: vi.fn(),
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    expect(rows[0].label).toBe('2026\nNHS England ICBs');
    expect(rows[1].label).toBe('Pre-2026\nNHS England ICBs');
  });

  it('shortens the NHS England Regions overlay label in the Overlays pane while keeping NHS England on one line', () => {
    const rows = buildOverlayPanelRows({
      layers: [
        createLayer({
          id: 'nhsEnglandRegionsBsc',
          name: 'NHS England Regions (2024 BSC)',
          family: 'nhsRegions',
        }),
      ],
      setOverlayLayerVisibility: vi.fn(),
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility: vi.fn(),
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth: vi.fn(),
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    expect(rows[0].label).toBe('NHS England\nRegions');
    expect(rows[0].titleClassName).toBe(
      'sidebar-exact-accordion-item__title--three-line-block',
    );
  });

  it('renames the SJC JMC overlay row to SJC JMC Regions and reserves the same title height', () => {
    const rows = buildOverlayPanelRows({
      layers: [
        createLayer({
          id: 'sjcJmcOutline',
          name: 'SJC JMC',
          family: 'customRegions',
        }),
      ],
      setOverlayLayerVisibility: vi.fn(),
      setOverlayLayerOpacity: vi.fn(),
      setOverlayLayerBorderVisibility: vi.fn(),
      setOverlayLayerBorderColor: vi.fn(),
      setOverlayLayerBorderWidth: vi.fn(),
      setOverlayLayerBorderOpacity: vi.fn(),
    });

    expect(rows[0].label).toBe('SJC JMC\nRegions');
    expect(rows[0].titleClassName).toBe(
      'sidebar-exact-accordion-item__title--three-line-block',
    );
  });
});
