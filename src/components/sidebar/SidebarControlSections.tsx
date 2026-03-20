import { SliderField } from '../controls/SliderField';

export interface SidebarColorFieldConfig {
  kind: 'color';
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export interface SidebarSliderFieldConfig {
  kind: 'slider';
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'raw' | 'percent';
  onChange: (value: number) => void;
}

export interface SidebarToggleFieldConfig {
  kind: 'toggle';
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export type SidebarControlFieldConfig =
  | SidebarColorFieldConfig
  | SidebarSliderFieldConfig
  | SidebarToggleFieldConfig;

export interface SidebarControlSectionConfig {
  title: string;
  fields: SidebarControlFieldConfig[];
}

interface SidebarControlSectionsProps {
  sections: SidebarControlSectionConfig[];
  ariaLabelPrefix: string;
}

export function SidebarControlSections({
  sections,
  ariaLabelPrefix,
}: SidebarControlSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="sidebar-control-section">
          <div className="sidebar-popover__section-title">{section.title}</div>
          <div className="sidebar-control-section__content">
          {section.fields.map((field) => (
            <SidebarControlField
              key={field.id}
              field={field}
              ariaLabelPrefix={`${ariaLabelPrefix} ${section.title}`}
            />
          ))}
          </div>
        </section>
      ))}
    </>
  );
}

function SidebarControlField({
  field,
  ariaLabelPrefix,
}: {
  field: SidebarControlFieldConfig;
  ariaLabelPrefix: string;
}) {
  if (field.kind === 'color') {
    return (
      <div className="sidebar-control-field">
        <label className="field-label" htmlFor={field.id}>
          {field.label}
        </label>
        <div className="sidebar-color-field__control">
          <span
            className="sidebar-color-field__preview"
            style={{ background: `linear-gradient(${field.value}, ${field.value})` }}
            aria-hidden="true"
          />
          <input
            id={field.id}
            className="color-input color-input--popover sidebar-color-field__input"
            type="color"
            value={field.value}
            onChange={(event) => field.onChange(event.currentTarget.value)}
            aria-label={`${ariaLabelPrefix} ${field.label}`}
          />
        </div>
      </div>
    );
  }

  if (field.kind === 'toggle') {
    return (
      <label className="sidebar-toggle-field" htmlFor={field.id}>
        <span className="field-label">{field.label}</span>
        <input
          id={field.id}
          className="checkbox"
          type="checkbox"
          checked={field.checked}
          onChange={(event) => field.onChange(event.currentTarget.checked)}
          aria-label={`${ariaLabelPrefix} ${field.label}`}
        />
      </label>
    );
  }

  return (
    <div className="sidebar-control-field">
      <label className="field-label" htmlFor={field.id}>
        {field.label}
      </label>
      <SliderField
        id={field.id}
        min={field.min ?? 0}
        max={field.max ?? 1}
        step={field.step ?? 0.05}
        value={field.value}
        onChange={field.onChange}
        ariaLabel={`${ariaLabelPrefix} ${field.label}`}
        mode={field.mode ?? 'percent'}
      />
    </div>
  );
}
