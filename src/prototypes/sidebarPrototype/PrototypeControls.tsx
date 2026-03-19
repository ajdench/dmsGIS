import { useState, type ReactNode } from 'react';
import { SliderField } from '../../components/controls/SliderField';

interface PrototypeToggleButtonProps {
  enabled: boolean;
  onClick?: () => void;
}

interface PrototypeMetricPillProps {
  value: string;
  swatch?: string;
}

interface PrototypeControlFieldProps {
  label: string;
  children: ReactNode;
}

interface PrototypeColorFieldProps {
  id: string;
  label: string;
  defaultValue: string;
}

interface PrototypeSliderControlProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'raw' | 'percent';
}

interface PrototypeStaticRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  value: string;
  swatch?: string;
}

export function PrototypeToggleButton({
  enabled,
  onClick,
}: PrototypeToggleButtonProps) {
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);

  return (
    <button
      type="button"
      className={`prototype-toggle-button${enabled ? ' is-on' : ' is-off'}`}
      data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
      onClick={() => {
        setSuppressHoverPreview(true);
        onClick?.();
      }}
      onMouseLeave={() => setSuppressHoverPreview(false)}
      aria-label={enabled ? 'On' : 'Off'}
    >
      <span className="prototype-toggle-button__label prototype-toggle-button__label--default">
        {enabled ? 'On' : 'Off'}
      </span>
      <span className="prototype-toggle-button__label prototype-toggle-button__label--hover">
        {enabled ? 'Off' : 'On'}
      </span>
    </button>
  );
}

export function PrototypeMetricPill({
  value,
  swatch,
}: PrototypeMetricPillProps) {
  return (
    <span
      className={`prototype-metric-pill${
        swatch ? ' prototype-metric-pill--swatch' : ''
      }`}
    >
      {swatch ? (
        <span
          className="prototype-metric-pill__swatch"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      ) : null}
      <span>{value}</span>
    </span>
  );
}

export function PrototypeControlField({
  label,
  children,
}: PrototypeControlFieldProps) {
  return (
    <div className="prototype-control-field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export function PrototypeColorField({
  id,
  label,
  defaultValue,
}: PrototypeColorFieldProps) {
  return (
    <div className="prototype-control-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="color-input color-input--popover"
        type="color"
        defaultValue={defaultValue}
      />
    </div>
  );
}

export function PrototypeSliderControl({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  mode = 'percent',
}: PrototypeSliderControlProps) {
  return (
    <div className="prototype-control-field">
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

export function PrototypeStaticRow({
  label,
  enabled,
  onToggle,
  value,
  swatch,
}: PrototypeStaticRowProps) {
  return (
    <div className="prototype-region-row">
      <span className="color-control__label color-control__label--region">
        {label}
      </span>
      <span className="prototype-accordion-item__meta">
        <PrototypeToggleButton enabled={enabled} onClick={onToggle} />
        <PrototypeMetricPill value={value} swatch={swatch} />
      </span>
    </div>
  );
}
