import { describe, expect, it, vi } from 'vitest';
import {
  buildFacilityControlSections,
  buildLabelControlSections,
  buildOverlayControlSections,
  buildRegionControlSections,
} from '../src/prototypes/sidebarPrototype/popoverFields';

describe('popoverFields builders', () => {
  it('builds facility sections with points and border groups', () => {
    const setFacilityStyle = vi.fn();

    const sections = buildFacilityControlSections({
      facilityShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityColor: '#ed5151',
      facilityOpacity: 0.75,
      mixedFacilityColors: [{ color: '#ed5151', opacity: 0.75 }],
      facilityBorderColor: '#cbd5e1',
      facilityBorderWidth: 1,
      facilityBorderOpacity: 0.2,
      mixedFacilityBorderColors: [{ color: '#cbd5e1', opacity: 0.2 }],
      setFacilityStyle,
    });

    expect(sections.map((section) => section.title)).toEqual(['Points', 'Border']);
    expect(sections[0].fields.map((field) => field.label)).toEqual([
      'Shape',
      'Size',
      'Colour',
      'Opacity',
    ]);
    expect(sections[1].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Line thickness',
      'Border opacity',
    ]);

    sections[0].fields[0].onChange('triangle');
    sections[1].fields[1].onChange(2);

    expect(setFacilityStyle).toHaveBeenNthCalledWith(1, 'shape', 'triangle');
    expect(setFacilityStyle).toHaveBeenNthCalledWith(2, 'borderWidth', 2);
  });

  it('builds label sections with text and border groups', () => {
    const setLabelStyle = vi.fn();

    const sections = buildLabelControlSections(
      {
        id: 'country-labels',
        colourId: 'country-label-colour',
        opacityId: 'country-label-opacity',
      },
      {
        size: 8,
        opacity: 0.4,
        color: '#0f172a',
        borderColor: '#f8fafc',
        borderWidth: 0.5,
        borderOpacity: 0.3,
      },
      setLabelStyle,
    );

    expect(sections.map((section) => section.title)).toEqual(['Text', 'Border']);
    sections[0].fields[1].onChange(10);
    sections[1].fields[0].onChange('#ffffff');

    expect(setLabelStyle).toHaveBeenNthCalledWith(1, 'country-labels', 'size', 10);
    expect(setLabelStyle).toHaveBeenNthCalledWith(
      2,
      'country-labels',
      'borderColor',
      '#ffffff',
    );
  });

  it('builds overlay sections with layer and border groups', () => {
    const setOverlayStyle = vi.fn();

    const sections = buildOverlayControlSections(
      'careBoards',
      {
        opacity: 1,
        color: '#f4b740',
        borderColor: '#8f8f8f',
        borderWidth: 1,
        borderOpacity: 0.35,
      },
      setOverlayStyle,
    );

    expect(sections.map((section) => section.title)).toEqual(['Layer', 'Border']);
    sections[0].fields[0].onChange('#111111');
    sections[1].fields[2].onChange(0.5);

    expect(setOverlayStyle).toHaveBeenNthCalledWith(1, 'careBoards', 'color', '#111111');
    expect(setOverlayStyle).toHaveBeenNthCalledWith(
      2,
      'careBoards',
      'borderOpacity',
      0.5,
    );
  });

  it('builds region sections that return updated full state objects', () => {
    const onStyleChange = vi.fn();
    const styleState = {
      shape: 'circle' as const,
      size: 3.5,
      opacity: 0.75,
      color: '#ed5151',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      borderOpacity: 0.2,
    };

    const sections = buildRegionControlSections('North', styleState, onStyleChange);

    sections[0].fields[0].onChange('square');
    sections[1].fields[1].onChange(2.5);

    expect(onStyleChange).toHaveBeenNthCalledWith(1, {
      ...styleState,
      shape: 'square',
    });
    expect(onStyleChange).toHaveBeenNthCalledWith(2, {
      ...styleState,
      borderWidth: 2.5,
    });
  });
});
