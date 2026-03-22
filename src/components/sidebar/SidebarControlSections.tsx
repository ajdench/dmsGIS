import { SliderField } from '../controls/SliderField';
import type {
  SidebarColorFieldDefinition,
  SidebarControlFieldDefinition,
  SidebarPopoverSectionDefinition,
} from '../../lib/sidebar/contracts';
import { SidebarToggleButton } from './SidebarToggleButton';

interface SidebarControlSectionsProps {
  sections: SidebarPopoverSectionDefinition[];
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
          <div className="sidebar-popover__section-header">
            <div className="sidebar-popover__section-title">{section.title}</div>
            {section.enabledState !== undefined && section.onEnabledChange ? (
              <div className="sidebar-control-section__toggle">
                <SidebarToggleButton
                  state={section.enabledState}
                  ariaLabel={`${ariaLabelPrefix} ${section.title} visible`}
                  onChange={section.onEnabledChange}
                />
              </div>
            ) : null}
          </div>
          <div className="sidebar-control-section__content">
          {section.fields.map((field) => (
            <SidebarControlField
              key={field.kind === 'shape' ? field.label : field.id}
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
  field: SidebarControlFieldDefinition;
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
            style={{
              background: buildColorPreviewBackground(
                field.value,
                field.opacityPreview,
                field.mixedSwatches,
              ),
            }}
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

  if (field.kind === 'shape') {
    return (
      <div className="sidebar-control-field">
        <span className="field-label">{field.label}</span>
        <div className="sidebar-shape-field" role="group" aria-label={`${ariaLabelPrefix} ${field.label}`}>
          {(['circle', 'square', 'diamond', 'triangle'] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              className={`sidebar-shape-field__button${
                field.value === shape ? ' is-active' : ''
              } is-${shape}`}
              onClick={() => field.onChange(shape)}
              aria-pressed={field.value === shape}
              aria-label={`${ariaLabelPrefix} ${field.label} ${shape}`}
            >
              <span className="sidebar-shape-field__icon" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
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

function buildColorPreviewBackground(
  value: string,
  opacityPreview?: number,
  mixedSwatches?: SidebarColorFieldDefinition['mixedSwatches'],
) {
  if (mixedSwatches && mixedSwatches.length > 0) {
    const stops = mixedSwatches.slice(0, 4).map((stop, index, array) => {
      const start = (index / array.length) * 100;
      const end = ((index + 1) / array.length) * 100;
      return `${applyOpacity(stop.color, stop.opacity ?? 1)} ${start}% ${end}%`;
    });

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  return `linear-gradient(${applyOpacity(value, opacityPreview ?? 1)}, ${applyOpacity(value, opacityPreview ?? 1)})`;
}

function applyOpacity(color: string, opacity: number): string {
  if (opacity >= 1) {
    return color;
  }

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalizedHex =
      hex.length === 3
        ? hex
            .split('')
            .map((value) => value + value)
            .join('')
        : hex;

    if (normalizedHex.length === 6) {
      const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
      const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
      const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

      return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }
  }

  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}
