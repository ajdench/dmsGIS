import type { ReactNode } from 'react';
import {
  PrototypeColorField,
  PrototypeControlField,
  PrototypeControlSection,
  type PrototypeShape,
  PrototypeShapePicker,
  PrototypeSliderControl,
  type SwatchStop,
} from './PrototypeControls';

export type PrototypeControlConfig =
  | {
      kind: 'shape';
      label: string;
      value: PrototypeShape;
      onChange: (value: PrototypeShape) => void;
    }
  | {
      kind: 'color';
      id: string;
      label: string;
      value: string;
      opacityPreview?: number;
      mixedSwatches?: SwatchStop[];
      onChange: (value: string) => void;
    }
  | {
      kind: 'slider';
      id: string;
      label: string;
      value: number;
      onChange: (value: number) => void;
      min?: number;
      max?: number;
      step?: number;
      mode?: 'raw' | 'percent';
    };

export interface PrototypeControlSectionConfig {
  title: string;
  fields: PrototypeControlConfig[];
}

export function renderPrototypeControlField(field: PrototypeControlConfig) {
  if (field.kind === 'shape') {
    return (
      <PrototypeControlField key={field.label} label={field.label}>
        <PrototypeShapePicker value={field.value} onChange={field.onChange} />
      </PrototypeControlField>
    );
  }

  if (field.kind === 'color') {
    return (
      <PrototypeColorField
        key={field.id}
        id={field.id}
        label={field.label}
        value={field.value}
        opacityPreview={field.opacityPreview}
        mixedSwatches={field.mixedSwatches}
        onChange={field.onChange}
      />
    );
  }

  return (
    <PrototypeSliderControl
      key={field.id}
      id={field.id}
      label={field.label}
      value={field.value}
      min={field.min}
      max={field.max}
      step={field.step}
      mode={field.mode}
      onChange={field.onChange}
    />
  );
}

export function renderPrototypeControlSections(
  sections: PrototypeControlSectionConfig[],
): ReactNode[] {
  return sections.flatMap((section, index) => {
    const renderedSection = (
      <PrototypeControlSection key={section.title} title={section.title}>
        {section.fields.map(renderPrototypeControlField)}
      </PrototypeControlSection>
    );

    if (index === 0) {
      return [renderedSection];
    }

    return [
      <div
        key={`${section.title}-divider`}
        className="prototype-popover__divider"
        aria-hidden="true"
      />,
      renderedSection,
    ];
  });
}
