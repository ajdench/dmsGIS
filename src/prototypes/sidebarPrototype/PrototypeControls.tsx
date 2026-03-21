import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { SliderField } from '../../components/controls/SliderField';
import { computeFloatingCalloutPlacement } from './floatingCallout';

interface PrototypeToggleButtonProps {
  enabled: boolean;
  onClick?: () => void;
}

interface PrototypeMetricPillProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  swatch?: string;
  swatchOpacity?: number;
  swatchMix?: SwatchStop[];
  swatchShape?: PrototypeShape;
  swatchBorderColor?: string;
  swatchBorderWidth?: number;
  swatchBorderOpacity?: number;
  asButton?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'dialog';
}

interface PrototypeControlFieldProps {
  label: string;
  children: ReactNode;
}

interface PrototypeColorFieldProps {
  id: string;
  label: string;
  value: string;
  opacityPreview?: number;
  mixedSwatches?: SwatchStop[];
  onChange?: (value: string) => void;
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

type PrototypeShape = 'circle' | 'square' | 'diamond' | 'triangle';
export type { PrototypeShape, SwatchStop };

interface PrototypeShapePickerProps {
  value: PrototypeShape;
  onChange: (value: PrototypeShape) => void;
}

interface PrototypePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  scrollContainer?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  viewportContainer?: HTMLElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
}

interface PrototypeControlSectionProps {
  title: string;
  children: ReactNode;
}

interface PrototypePillPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  swatch?: string;
  swatchOpacity?: number;
  swatchMix?: SwatchStop[];
  swatchShape?: PrototypeShape;
  swatchBorderColor?: string;
  swatchBorderWidth?: number;
  swatchBorderOpacity?: number;
  scrollContainer?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  viewportContainer?: HTMLElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
  children: ReactNode;
}

interface PrototypeDragHandleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

interface PrototypeMetaControlsProps {
  enabled?: boolean;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
}

interface PrototypeSectionCardShellProps {
  title: string;
  enabled?: boolean;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
  body?: ReactNode;
  style?: CSSProperties;
  isDragging?: boolean;
}

interface PrototypeInlineRowShellProps {
  label: string;
  enabled: boolean;
  onEnabledToggle: () => void;
  pillPopover: ReactNode;
  trailingControl?: ReactNode;
  style?: CSSProperties;
  isDragging?: boolean;
}

interface SwatchStop {
  color: string;
  opacity?: number;
}

const SHAPE_OPTIONS: PrototypeShape[] = [
  'circle',
  'square',
  'diamond',
  'triangle',
];

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

function buildMixedSwatchBackground(stops: SwatchStop[]) {
  if (stops.length === 0) {
    return undefined;
  }

  if (stops.length === 1) {
    const color = applyOpacityToColor(stops[0].color, stops[0].opacity ?? 1);
    return `linear-gradient(${color}, ${color})`;
  }

  const normalizedStops = stops.slice(0, 4);
  const gradientStops = buildBlendedGradientStops(normalizedStops, 0.34);

  return `conic-gradient(from 225deg, ${gradientStops})`;
}

function buildMixedRectSwatchBackground(stops: SwatchStop[]) {
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

function buildBlendedGradientStops(stops: SwatchStop[], featherRatio: number) {
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
    gradientStops.push(
      `${nextColor} ${Math.min(100, boundary + feather)}%`,
    );
  });

  return gradientStops.join(', ');
}

function buildSwatchStyle({
  color,
  opacity = 1,
  mix,
  borderColor,
  borderOpacity = 1,
  borderWidth,
}: {
  color?: string;
  opacity?: number;
  mix?: SwatchStop[];
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: string;
}): CSSProperties {
  const fillColor = color
    ? applyOpacityToColor(color, opacity)
    : mix && mix.length > 0
      ? applyOpacityToColor(mix[0].color, mix[0].opacity ?? 1)
      : undefined;
  const previewBackground =
    mix && mix.length > 0
      ? buildMixedSwatchBackground(mix)
      : color
        ? `linear-gradient(${applyOpacityToColor(color, opacity)}, ${applyOpacityToColor(color, opacity)})`
        : undefined;

  return {
    background: previewBackground,
    borderColor: borderColor
      ? applyOpacityToColor(borderColor, borderOpacity)
      : undefined,
    borderWidth,
    ['--prototype-swatch-fill' as string]: previewBackground,
    ['--prototype-swatch-fill-color' as string]: fillColor,
    ['--prototype-swatch-border-color' as string]: borderColor
      ? applyOpacityToColor(borderColor, borderOpacity)
      : undefined,
    ['--prototype-swatch-border-width' as string]: borderWidth,
  };
}

function getShapeStrokeWidth(borderWidth: number) {
  return Math.max(0, Math.min(18, borderWidth * 8));
}

function getShapeGeometry(shape: PrototypeShape, strokeWidth: number) {
  const inset = 12 + strokeWidth / 2;
  const max = 100 - inset;
  const center = 50;
  const radius = Math.max(0, 38 - strokeWidth / 2);

  switch (shape) {
    case 'circle':
      return {
        element: (
          <circle
            cx={center}
            cy={center}
            r={radius}
            vectorEffect="non-scaling-stroke"
          />
        ),
      };
    case 'square':
      return {
        element: (
          <rect
            x={inset}
            y={inset}
            width={Math.max(0, max - inset)}
            height={Math.max(0, max - inset)}
            rx={6}
            ry={6}
            vectorEffect="non-scaling-stroke"
          />
        ),
      };
    case 'diamond':
      return {
        element: (
          <path
            d={`M ${center} ${inset} L ${max} ${center} L ${center} ${max} L ${inset} ${center} Z`}
            vectorEffect="non-scaling-stroke"
          />
        ),
      };
    case 'triangle':
      return {
        element: (
          <path
            d={`M ${center} ${inset} L ${max} ${max} L ${inset} ${max} Z`}
            vectorEffect="non-scaling-stroke"
          />
        ),
      };
  }
}

interface PrototypeShapeSvgProps {
  shape: PrototypeShape;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

function PrototypeShapeSvg({
  shape,
  fill,
  stroke = 'transparent',
  strokeWidth = 0,
  className,
}: PrototypeShapeSvgProps) {
  const geometry = getShapeGeometry(shape, strokeWidth);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      >
        {geometry.element}
      </g>
    </svg>
  );
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

export const PrototypeMetricPill = forwardRef<
  HTMLButtonElement,
  PrototypeMetricPillProps
>(function PrototypeMetricPill(
  {
    value,
    swatch,
    swatchOpacity = 1,
    swatchMix,
    swatchShape = 'circle',
    swatchBorderColor = 'rgba(148, 163, 184, 0.6)',
    swatchBorderWidth = 1,
    swatchBorderOpacity = 1,
    asButton = false,
    ariaExpanded,
    ariaHaspopup,
    className,
    type,
    ...buttonProps
  },
  ref,
) {
  const fillColor = swatch
    ? applyOpacityToColor(swatch, swatchOpacity)
    : 'transparent';
  const strokeColor = swatchBorderColor
    ? applyOpacityToColor(swatchBorderColor, swatchBorderOpacity)
    : 'transparent';
  const shapeStrokeWidth = getShapeStrokeWidth(swatchBorderWidth);
  const content = (
    <>
      {swatch ? (
        swatchMix && swatchMix.length > 1 ? (
          <span
            className="prototype-metric-pill__swatch prototype-metric-pill__swatch--mixed"
            style={buildSwatchStyle({
              color: swatch,
              opacity: swatchOpacity,
              mix: swatchMix,
              borderColor: swatchBorderColor,
              borderOpacity: swatchBorderOpacity,
              borderWidth: `${swatchBorderWidth}px`,
            })}
            aria-hidden="true"
          />
        ) : (
          <span
            className={`prototype-metric-pill__swatch prototype-metric-pill__swatch--${swatchShape}`}
          >
            <PrototypeShapeSvg
              shape={swatchShape}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={shapeStrokeWidth}
              className={`prototype-metric-pill__swatch-svg prototype-metric-pill__swatch-svg--${swatchShape}`}
            />
          </span>
        )
      ) : null}
      <span>{value}</span>
    </>
  );

  if (asButton) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={`prototype-metric-pill prototype-metric-pill--button${
          swatch ? ' prototype-metric-pill--swatch' : ''
        }${className ? ` ${className}` : ''}`}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`prototype-metric-pill${
        swatch ? ' prototype-metric-pill--swatch' : ''
      }`}
    >
      {content}
    </span>
  );
});

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

export function PrototypeControlSection({
  title,
  children,
}: PrototypeControlSectionProps) {
  return (
    <section className="prototype-control-section">
      <div className="prototype-popover__section-title">{title}</div>
      <div className="prototype-control-section__content">{children}</div>
    </section>
  );
}

export function PrototypePillPopover({
  open,
  onOpenChange,
  value,
  swatch,
  swatchOpacity,
  swatchMix,
  swatchShape,
  swatchBorderColor,
  swatchBorderWidth,
  swatchBorderOpacity,
  scrollContainer,
  portalContainer,
  viewportContainer,
  triangleMinRatio,
  triangleMaxRatio,
  children,
}: PrototypePillPopoverProps) {
  return (
    <PrototypePopover
      open={open}
      onOpenChange={onOpenChange}
      scrollContainer={scrollContainer}
      portalContainer={portalContainer}
      viewportContainer={viewportContainer}
      triangleMinRatio={triangleMinRatio}
      triangleMaxRatio={triangleMaxRatio}
      trigger={
        <PrototypeMetricPill
          value={value}
          swatch={swatch}
          swatchOpacity={swatchOpacity}
          swatchMix={swatchMix}
          swatchShape={swatchShape}
          swatchBorderColor={swatchBorderColor}
          swatchBorderWidth={swatchBorderWidth}
          swatchBorderOpacity={swatchBorderOpacity}
          asButton
          ariaExpanded={open}
          ariaHaspopup="dialog"
        />
      }
    >
      <div className="prototype-popover__content">{children}</div>
    </PrototypePopover>
  );
}

export const PrototypeDragHandle = forwardRef<
  HTMLButtonElement,
  PrototypeDragHandleProps
>(function PrototypeDragHandle({ label, className, ...buttonProps }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`prototype-drag-handle${className ? ` ${className}` : ''}`}
      aria-label={`Reorder ${label}`}
      {...buttonProps}
    >
      <span className="prototype-drag-handle__dots" aria-hidden="true">
        ⋮⋮
      </span>
    </button>
  );
});

export function PrototypeMetaControls({
  enabled,
  onEnabledToggle,
  pillPopover,
  trailingControl,
}: PrototypeMetaControlsProps) {
  return (
    <span className="prototype-accordion-item__meta">
      {typeof enabled === 'boolean' ? (
        <PrototypeToggleButton enabled={enabled} onClick={onEnabledToggle} />
      ) : null}
      {pillPopover}
      {trailingControl}
    </span>
  );
}

export function PrototypeSectionCardShell({
  title,
  enabled,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  body,
  style,
  isDragging = false,
}: PrototypeSectionCardShellProps) {
  return (
    <section
      className={`prototype-section-card${isDragging ? ' is-dragging' : ''}`}
      style={style}
    >
      <div className="prototype-section-card__bar">
        <span className="prototype-accordion-item__title-wrap">
          <span className="prototype-accordion-item__title">{title}</span>
        </span>
        <PrototypeMetaControls
          enabled={enabled}
          onEnabledToggle={onEnabledToggle}
          pillPopover={pillPopover}
          trailingControl={trailingControl}
        />
      </div>
      {body ? <div className="prototype-section-card__body">{body}</div> : null}
    </section>
  );
}

export function PrototypeInlineRowShell({
  label,
  enabled,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  style,
  isDragging = false,
}: PrototypeInlineRowShellProps) {
  return (
    <div
      className={`prototype-region-row${isDragging ? ' is-dragging' : ''}`}
      style={style}
    >
      <span className="color-control__label color-control__label--region">
        {label}
      </span>
      <PrototypeMetaControls
        enabled={enabled}
        onEnabledToggle={onEnabledToggle}
        pillPopover={pillPopover}
        trailingControl={trailingControl}
      />
    </div>
  );
}

export function PrototypeColorField({
  id,
  label,
  value,
  opacityPreview = 1,
  mixedSwatches,
  onChange,
}: PrototypeColorFieldProps) {
  return (
    <div className="prototype-control-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="prototype-color-field__control">
        <span
          className="prototype-color-field__preview"
          style={{
            background:
              mixedSwatches && mixedSwatches.length > 0
                ? buildMixedRectSwatchBackground(mixedSwatches)
                : `linear-gradient(${applyOpacityToColor(value, opacityPreview)}, ${applyOpacityToColor(value, opacityPreview)})`,
          }}
          aria-hidden="true"
        />
        <input
          id={id}
          className="color-input color-input--popover prototype-color-field__input"
          type="color"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
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

export function PrototypeShapePicker({
  value,
  onChange,
}: PrototypeShapePickerProps) {
  return (
    <div className="prototype-shape-picker" role="group" aria-label="Shape">
      {SHAPE_OPTIONS.map((shape) => (
        <button
          key={shape}
          type="button"
          className={`prototype-shape-button${
            value === shape ? ' is-selected' : ''
          }`}
          onClick={() => onChange(shape)}
          aria-pressed={value === shape}
          aria-label={shape}
        >
          <PrototypeShapeSvg
            shape={shape}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={4}
            className={`prototype-shape-icon prototype-shape-icon--${shape}`}
          />
        </button>
      ))}
    </div>
  );
}

export function PrototypePopover({
  open,
  onOpenChange,
  trigger,
  children,
  scrollContainer,
  portalContainer,
  viewportContainer,
  triangleMinRatio,
  triangleMaxRatio,
}: PrototypePopoverProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [positionStyle, setPositionStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const triggerElement = triggerRef.current;
      const contentElement = contentRef.current;
      const sidebarElement = scrollContainer;
      const viewportElement = viewportContainer;

      if (
        !triggerElement ||
        !contentElement ||
        !sidebarElement ||
        !viewportElement
      ) {
        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const viewportRect = viewportElement.getBoundingClientRect();

      const portalRect = portalContainer?.getBoundingClientRect();
      const placement = computeFloatingCalloutPlacement({
        triggerRect,
        contentRect,
        viewportRect,
        portalRect,
        triangleMinRatio,
        triangleMaxRatio,
      });

      setPositionStyle({
        position: 'absolute',
        top: placement.top,
        left: placement.left,
        ['--prototype-popover-triangle-y' as string]: `${placement.triangleCenter}px`,
      });
    };

    updatePosition();

    let frameId: number | null = null;
    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updatePosition();
      });
    };

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    scrollContainer?.addEventListener('scroll', scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      scrollContainer?.removeEventListener('scroll', scheduleUpdate);
    };
  }, [
    open,
    portalContainer,
    scrollContainer,
    triangleMaxRatio,
    triangleMinRatio,
    viewportContainer,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  return (
    <div className="prototype-popover-anchor">
      <div
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        className="prototype-popover-anchor__trigger"
      >
        {trigger}
      </div>
      {open
        ? createPortal(
            <div
              ref={contentRef}
              className="prototype-popover prototype-popover--floating"
              style={positionStyle ?? undefined}
            >
              {children}
            </div>,
            portalContainer ?? document.body,
          )
        : null}
    </div>
  );
}
