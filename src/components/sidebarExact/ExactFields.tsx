import type { SidebarControlFieldDefinition } from '../../lib/sidebar/contracts';
import { SliderField } from '../controls/SliderField';
import { ExactShapeIcon } from './ExactSwatch';
import { ExactToggleButton } from './ExactToggleButton';
import type {
  ExactColorFieldProps,
  ExactControlFieldProps,
  ExactControlSectionProps,
  ExactFieldSectionsProps,
  ExactSliderControlProps,
} from './types';

export function ExactControlField({ label, children }: ExactControlFieldProps) {
  return (
    <div className="sidebar-exact-control-field prototype-control-field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export function ExactControlSection({
  title,
  enabled = true,
  toggleState,
  onToggle,
  children,
}: ExactControlSectionProps) {
  return (
    <section
      className={`sidebar-exact-control-section prototype-control-section${
        enabled ? '' : ' sidebar-exact-control-section--disabled prototype-control-section--disabled'
      }`}
    >
      <div className="sidebar-exact-popover__section-title prototype-popover__section-title">
        {title}
      </div>
      {onToggle ? (
        <div className="sidebar-exact-control-section__toggle prototype-control-section__toggle">
          <ExactToggleButton enabled={enabled} state={toggleState} onClick={onToggle} />
        </div>
      ) : null}
      <div
        className="sidebar-exact-control-section__content prototype-control-section__content"
        aria-disabled={enabled ? undefined : 'true'}
      >
        {children}
      </div>
    </section>
  );
}

export function ExactColorField({
  id,
  label,
  value,
  opacityPreview = 1,
  mixedSwatches,
  onChange,
}: ExactColorFieldProps) {
  const previewBackground =
    mixedSwatches && mixedSwatches.length > 0
      ? buildMixedRectSwatchBackground(mixedSwatches)
      : `linear-gradient(${applyOpacityToColor(value, opacityPreview)}, ${applyOpacityToColor(value, opacityPreview)})`;

  return (
    <div className="sidebar-exact-control-field prototype-control-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="sidebar-exact-color-field__control prototype-color-field__control">
        <span
          className="sidebar-exact-color-field__preview prototype-color-field__preview"
          style={{ background: previewBackground }}
          aria-hidden="true"
        />
        <input
          id={id}
          className="color-input color-input--popover sidebar-exact-color-field__input prototype-color-field__input"
          type="color"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
    </div>
  );
}

export function ExactSliderControl({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  mode = 'percent',
}: ExactSliderControlProps) {
  return (
    <div className="sidebar-exact-control-field prototype-control-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <SliderField
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        ariaLabel={label}
        mode={mode}
      />
    </div>
  );
}

export function ExactFieldSections({
  sections,
  ariaLabelPrefix,
}: ExactFieldSectionsProps) {
  return (
    <>
      {sections.flatMap((section, index) => {
        const renderedSection = (
          <ExactControlSection
            key={section.title}
            title={section.title}
            enabled={section.enabledState !== 'off'}
            toggleState={section.enabledState}
            onToggle={
              section.onEnabledChange
                ? () => section.onEnabledChange?.(section.enabledState !== 'on')
                : undefined
            }
          >
            {section.fields.map((field) => (
              <ExactField
                key={field.kind === 'shape' ? field.label : field.id}
                field={field}
                ariaLabelPrefix={ariaLabelPrefix}
              />
            ))}
          </ExactControlSection>
        );

        if (index === 0) {
          return [renderedSection];
        }

        return [
          <div
            key={`${section.title}-divider`}
            className="sidebar-exact-popover__divider prototype-popover__divider"
            aria-hidden="true"
          />,
          renderedSection,
        ];
      })}
    </>
  );
}

function ExactField({
  field,
  ariaLabelPrefix,
}: {
  field: SidebarControlFieldDefinition;
  ariaLabelPrefix: string;
}) {
  if (field.kind === 'color') {
    return (
      <ExactColorField
        id={field.id}
        label={field.label}
        value={field.value}
        opacityPreview={field.opacityPreview}
        mixedSwatches={field.mixedSwatches}
        onChange={field.onChange}
      />
    );
  }

  if (field.kind === 'slider') {
    return (
      <ExactSliderControl
        id={field.id}
        label={field.label}
        value={field.value}
        onChange={field.onChange}
        min={field.min}
        max={field.max}
        step={field.step}
        mode={field.mode}
      />
    );
  }

  if (field.kind === 'toggle') {
    return (
      <ExactControlField label={field.label}>
        <ExactToggleButton
          enabled={field.checked}
          onClick={() => field.onChange(!field.checked)}
        />
      </ExactControlField>
    );
  }

  return (
    <ExactControlField label={field.label}>
      <div
        className="sidebar-exact-shape-picker prototype-shape-picker"
        role="group"
        aria-label={`${ariaLabelPrefix} ${field.label}`}
      >
        {(['circle', 'square', 'diamond', 'triangle'] as const).map((shape) => (
          <button
            key={shape}
            type="button"
            className={`sidebar-exact-shape-button prototype-shape-button${
              field.value === shape ? ' is-selected' : ''
            }`}
            onClick={() => field.onChange(shape)}
            aria-pressed={field.value === shape}
            aria-label={shape}
          >
            <ExactShapeIcon
              shape={shape}
              className={`sidebar-exact-shape-icon sidebar-exact-shape-icon--${shape} prototype-shape-icon prototype-shape-icon--${shape}`}
            />
          </button>
        ))}
      </div>
    </ExactControlField>
  );
}

function buildMixedRectSwatchBackground(
  stops: NonNullable<ExactColorFieldProps['mixedSwatches']>,
) {
  if (stops.length === 0) {
    return undefined;
  }

  if (stops.length === 1) {
    const color = applyOpacityToColor(stops[0].color, stops[0].opacity ?? 1);
    return `linear-gradient(${color}, ${color})`;
  }

  const normalizedStops = stops.slice(0, 4);
  const gradientStops = buildBlendedGradientStops(normalizedStops, 0.2);
  return `linear-gradient(90deg, ${gradientStops})`;
}

function buildBlendedGradientStops(
  stops: NonNullable<ExactColorFieldProps['mixedSwatches']>,
  featherRatio: number,
) {
  const normalizedStops = stops.map((stop) =>
    applyOpacityToColor(stop.color, stop.opacity ?? 1),
  );

  if (normalizedStops.length === 1) {
    return `${normalizedStops[0]} 0% 100%`;
  }

  const segment = 100 / normalizedStops.length;
  const feather = segment * featherRatio;
  const gradientStops: string[] = [`${normalizedStops[0]} 0%`];

  normalizedStops.forEach((color, index) => {
    const boundary = segment * (index + 1);
    const nextColor = normalizedStops[index + 1];

    if (!nextColor) {
      gradientStops.push(`${color} 100%`);
      return;
    }

    gradientStops.push(`${color} ${Math.max(0, boundary - feather)}%`);
    gradientStops.push(`${nextColor} ${Math.min(100, boundary + feather)}%`);
  });

  return gradientStops.join(', ');
}

function applyOpacityToColor(color: string, opacity = 1) {
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
