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
  onCopy,
  copySwatches,
}: ExactColorFieldProps) {
  const previewBackground =
    mixedSwatches && mixedSwatches.length > 0
      ? buildMixedRectSwatchBackground(mixedSwatches)
      : `linear-gradient(${applyOpacityToColor(value, opacityPreview)}, ${applyOpacityToColor(value, opacityPreview)})`;

  const swatchEl = (
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
  );

  return (
    <div className="sidebar-exact-control-field prototype-control-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {onCopy ? (
        <div className="prototype-color-field__with-copy">
          {swatchEl}
          <CopyFillToBorderButton onClick={onCopy} swatches={copySwatches} />
        </div>
      ) : (
        swatchEl
      )}
    </div>
  );
}

function CopyFillToBorderButton({
  onClick,
  swatches,
}: {
  onClick: () => void;
  swatches?: ExactColorFieldProps['copySwatches'];
}) {
  const background =
    swatches && swatches.length > 1
      ? buildMixedRectSwatchBackground(swatches, 0.35)
      : swatches && swatches.length === 1
        ? applyOpacityToColor(swatches[0].color, swatches[0].opacity ?? 1)
        : undefined;

  // For hover: the button border becomes the copied colour(s).
  // Single colour → solid border. Multiple → gradient via background-clip trick.
  const hoverBorder =
    swatches && swatches.length > 1
      ? buildMixedRectSwatchBackground(swatches, 0.35)
      : swatches && swatches.length === 1
        ? applyOpacityToColor(swatches[0].color, swatches[0].opacity ?? 1)
        : undefined;

  const isGradientHover = swatches && swatches.length > 1;

  // Icon colour: stays white while swatch opacity ≥ 50%, then rapidly
  // transitions to dark grey below that threshold for maintained contrast.
  const avgOpacity = swatches && swatches.length > 0
    ? swatches.reduce((sum, s) => sum + (s.opacity ?? 1), 0) / swatches.length
    : 0;
  // Remap: opacity 1→0.5 stays at 255 (white), 0.5→0 blends 255→80 (dark grey)
  const t = avgOpacity >= 0.5 ? 1 : avgOpacity / 0.5; // 0–1 within the lower half
  const iconChannel = Math.round(255 * t + 80 * (1 - t));
  const iconColor = `rgb(${iconChannel}, ${iconChannel}, ${iconChannel})`;

  const cssVars: Record<string, string> = {};
  if (hoverBorder) cssVars['--copy-hover-border'] = hoverBorder;

  return (
    <button
      type="button"
      className={`prototype-copy-fill-button${isGradientHover ? ' prototype-copy-fill-button--gradient-hover' : ''}`}
      onClick={onClick}
      aria-label="Copy fill colour to border"
      title="Copy fill colour to border"
      style={Object.keys(cssVars).length > 0 ? cssVars as React.CSSProperties : undefined}
    >
      {background ? (
        <span
          className="prototype-copy-fill-button__swatch"
          style={{ background }}
          aria-hidden="true"
        />
      ) : null}
      <svg
        className="prototype-copy-fill-button__icon"
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
          fill={iconColor}
          stroke={iconColor}
          strokeWidth="var(--copy-icon-stroke-thicken, 0.4)"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </button>
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
        const isOff = section.enabledState === 'off';
        const fields =
          isOff && section.onEnabledChange
            ? section.fields.map((field) =>
                wrapFieldOnChange(field, () => section.onEnabledChange!(true)),
              )
            : section.fields;

        const renderedSection = (
          <ExactControlSection
            key={section.title}
            title={section.title}
            enabled={!isOff}
            toggleState={section.enabledState}
            onToggle={
              section.onEnabledChange
                ? () => section.onEnabledChange?.(section.enabledState !== 'on')
                : undefined
            }
          >
            {fields.map((field) => (
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
        onCopy={field.onCopy}
        copySwatches={field.copySwatches}
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
  featherRatio = 0.2,
) {
  if (stops.length === 0) {
    return undefined;
  }

  if (stops.length === 1) {
    const color = applyOpacityToColor(stops[0].color, stops[0].opacity ?? 1);
    return `linear-gradient(${color}, ${color})`;
  }

  const normalizedStops = stops.slice(0, 4);
  const gradientStops = buildBlendedGradientStops(normalizedStops, featherRatio);
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

function wrapFieldOnChange(
  field: SidebarControlFieldDefinition,
  onEnable: () => void,
): SidebarControlFieldDefinition {
  if (field.kind === 'color') {
    return { ...field, onChange: (value) => { onEnable(); field.onChange(value); } };
  }
  if (field.kind === 'slider') {
    return { ...field, onChange: (value) => { onEnable(); field.onChange(value); } };
  }
  if (field.kind === 'toggle') {
    return { ...field, onChange: (checked) => { onEnable(); field.onChange(checked); } };
  }
  return { ...field, onChange: (value) => { onEnable(); field.onChange(value); } };
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
