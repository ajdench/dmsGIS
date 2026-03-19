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
export type { PrototypeShape };

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
}

interface PrototypeControlSectionProps {
  title: string;
  children: ReactNode;
}

const SHAPE_OPTIONS: PrototypeShape[] = [
  'circle',
  'square',
  'diamond',
  'triangle',
];

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
  const content = (
    <>
      {swatch ? (
        <span
          className={`prototype-metric-pill__swatch prototype-metric-pill__swatch--${swatchShape}`}
          style={{
            backgroundColor: swatch,
            borderColor: swatchBorderColor,
            borderWidth: `${swatchBorderWidth}px`,
            opacity: swatchBorderOpacity,
          }}
          aria-hidden="true"
        />
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

export function PrototypeColorField({
  id,
  label,
  value,
  onChange,
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
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
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
          <span
            className={`prototype-shape-icon prototype-shape-icon--${shape}`}
            aria-hidden="true"
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
  }, [open, portalContainer, scrollContainer, viewportContainer]);

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
