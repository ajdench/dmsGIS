import { useEffect, useMemo, useState } from 'react';

interface SliderFieldProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  mode?: 'raw' | 'percent';
  className?: string;
}

export function SliderField({
  id,
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  mode = 'raw',
  className,
}: SliderFieldProps) {
  const [draft, setDraft] = useState('');
  const scaledValue = mode === 'percent' ? value * 100 : value;
  const scaledMin = mode === 'percent' ? min * 100 : min;
  const scaledMax = mode === 'percent' ? max * 100 : max;
  const scaledStep = mode === 'percent' ? step * 100 : step;
  const decimals = useMemo(
    () => getDecimals(scaledStep),
    [scaledStep],
  );

  useEffect(() => {
    setDraft(formatNumber(scaledValue, decimals));
  }, [scaledValue, decimals]);

  const setNext = (nextScaled: number) => {
    const clampedScaled = clamp(nextScaled, scaledMin, scaledMax);
    const normalizedScaled = roundToStep(
      clampedScaled,
      scaledMin,
      scaledStep,
      decimals,
    );
    const normalizedRaw =
      mode === 'percent' ? normalizedScaled / 100 : normalizedScaled;
    onChange(clamp(normalizedRaw, min, max));
  };

  return (
    <div className={`slider-field ${className ?? ''}`.trim()}>
      <input
        id={id}
        className="slider slider--full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        aria-label={ariaLabel}
      />
      <div className="slider-value" role="group" aria-label={`${ariaLabel} value`}>
        <button
          type="button"
          className="slider-value__button"
          onClick={() => setNext(scaledValue - scaledStep)}
          aria-label={`Decrease ${ariaLabel}`}
        >
          <span className="slider-value__symbol slider-value__symbol--minus">-</span>
        </button>
        <input
          className="slider-value__input"
          type="number"
          min={scaledMin}
          max={scaledMax}
          step={scaledStep}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            const parsed = Number(draft);
            if (Number.isFinite(parsed)) {
              setNext(parsed);
            }
            event.currentTarget.blur();
          }}
          onBlur={() => {
            const parsed = Number(draft);
            if (Number.isFinite(parsed)) {
              setNext(parsed);
            } else {
              setDraft(formatNumber(scaledValue, decimals));
            }
          }}
          aria-label={`${ariaLabel} numeric value`}
        />
        <button
          type="button"
          className="slider-value__button"
          onClick={() => setNext(scaledValue + scaledStep)}
          aria-label={`Increase ${ariaLabel}`}
        >
          <span className="slider-value__symbol slider-value__symbol--plus">+</span>
        </button>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDecimals(step: number): number {
  const text = step.toString();
  const index = text.indexOf('.');
  return index === -1 ? 0 : text.length - index - 1;
}

function roundToStep(
  value: number,
  min: number,
  step: number,
  decimals: number,
): number {
  const snapped = min + Math.round((value - min) / step) * step;
  const factor = 10 ** Math.max(0, decimals);
  return Math.round(snapped * factor) / factor;
}

function formatNumber(value: number, decimals: number): string {
  const fixed = value.toFixed(Math.max(0, decimals));
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}
