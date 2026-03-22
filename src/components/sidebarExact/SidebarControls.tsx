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
import { SliderField } from '../controls/SliderField';
import type {
  SidebarControlFieldDefinition,
  SidebarPillSummary,
  SidebarPopoverSectionDefinition,
} from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { computeFloatingCalloutPlacement } from '../../lib/sidebar/floatingCallout';
import { MetricPillSwatch } from '../sidebarShared/MetricPillSwatch';

interface ExactToggleButtonProps {
  enabled: boolean;
  state?: SidebarVisibilityState;
  onClick?: () => void;
}

interface ExactMetricPillProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  summary: SidebarPillSummary;
  asButton?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'dialog';
}

interface ExactPopoverProps {
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

interface ExactPillPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SidebarPillSummary;
  scrollContainer?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  viewportContainer?: HTMLElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
  children: ReactNode;
}

interface ExactDragHandleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

interface ExactMetaControlsProps {
  enabled?: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
  reserveTrailingSlot?: boolean;
}

interface ExactSectionCardShellProps {
  title: string;
  enabled?: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
  reserveTrailingSlot?: boolean;
  body?: ReactNode;
  style?: CSSProperties;
}

interface ExactInlineRowShellProps {
  label: string;
  enabled: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle: () => void;
  pillPopover: ReactNode;
  trailingControl?: ReactNode;
  style?: CSSProperties;
}

interface ExactControlSectionProps {
  title: string;
  enabled?: boolean;
  toggleState?: SidebarVisibilityState;
  onToggle?: () => void;
  children: ReactNode;
}

interface ExactFieldSectionsProps {
  sections: SidebarPopoverSectionDefinition[];
  ariaLabelPrefix: string;
}

export function ExactToggleButton({
  enabled,
  state = enabled ? 'on' : 'off',
  onClick,
}: ExactToggleButtonProps) {
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);
  const defaultLabel = state === 'mixed' ? 'Ox' : enabled ? 'On' : 'Off';
  const hoverLabel = enabled ? 'Off' : 'On';
  const ariaLabel =
    state === 'mixed' ? 'Mixed state; toggle all' : enabled ? 'On' : 'Off';

  return (
    <button
      type="button"
      className={`prototype-toggle-button prototype-toggle-button--${state}${
        state === 'on' ? ' is-on' : state === 'off' ? ' is-off' : ' is-mixed'
      }`}
      data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
      onClick={() => {
        setSuppressHoverPreview(true);
        onClick?.();
      }}
      onMouseLeave={() => setSuppressHoverPreview(false)}
      aria-label={ariaLabel}
    >
      <span className="prototype-toggle-button__label prototype-toggle-button__label--default">
        {defaultLabel}
      </span>
      <span className="prototype-toggle-button__label prototype-toggle-button__label--hover">
        {hoverLabel}
      </span>
    </button>
  );
}

export const ExactMetricPill = forwardRef<
  HTMLButtonElement,
  ExactMetricPillProps
>(function ExactMetricPill(
  {
    summary,
    asButton = false,
    ariaExpanded,
    ariaHaspopup,
    className,
    type,
    ...buttonProps
  },
  ref,
) {
  const swatch = summary.swatch;
  const content = (
    <>
      {swatch ? (
        <MetricPillSwatch
          swatch={swatch}
          swatchClassName="prototype-metric-pill__swatch"
          mixedClassName="prototype-metric-pill__swatch--mixed"
          defaultOutlineClassName="prototype-metric-pill__swatch--default-outline"
          svgClassName="prototype-metric-pill__swatch-svg"
        />
      ) : null}
      <span
        className={`prototype-metric-pill__value${
          swatch ? ' prototype-metric-pill__value--swatch' : ''
        }`}
      >
        {summary.valueLabel}
      </span>
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
        aria-label={summary.ariaLabel}
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
      aria-label={summary.ariaLabel}
    >
      {content}
    </span>
  );
});

export function ExactPillPopover({
  open,
  onOpenChange,
  summary,
  scrollContainer,
  portalContainer,
  viewportContainer,
  triangleMinRatio,
  triangleMaxRatio,
  children,
}: ExactPillPopoverProps) {
  return (
    <ExactPopover
      open={open}
      onOpenChange={onOpenChange}
      scrollContainer={scrollContainer}
      portalContainer={portalContainer}
      viewportContainer={viewportContainer}
      triangleMinRatio={triangleMinRatio}
      triangleMaxRatio={triangleMaxRatio}
      trigger={
        <ExactMetricPill
          summary={summary}
          asButton
          ariaExpanded={open}
          ariaHaspopup="dialog"
        />
      }
    >
      <div className="prototype-popover__content">{children}</div>
    </ExactPopover>
  );
}

export const ExactDragHandle = forwardRef<
  HTMLButtonElement,
  ExactDragHandleProps
>(function ExactDragHandle({ label, className, ...buttonProps }, ref) {
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

export function ExactMetaControls({
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  reserveTrailingSlot = false,
}: ExactMetaControlsProps) {
  return (
    <span className="prototype-accordion-item__meta">
      {typeof enabled === 'boolean' ? (
        <ExactToggleButton
          enabled={enabled}
          state={toggleState}
          onClick={onEnabledToggle}
        />
      ) : null}
      {pillPopover}
      {trailingControl}
      {reserveTrailingSlot ? (
        <span className="prototype-meta-spacer prototype-meta-spacer--drag" aria-hidden="true" />
      ) : null}
    </span>
  );
}

export function ExactSectionCardShell({
  title,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  reserveTrailingSlot = false,
  body,
  style,
}: ExactSectionCardShellProps) {
  return (
    <section className="prototype-section-card" style={style}>
      <div className="prototype-section-card__bar">
        <span className="prototype-accordion-item__title-wrap">
          <span className="prototype-accordion-item__title">{title}</span>
        </span>
        <ExactMetaControls
          enabled={enabled}
          toggleState={toggleState}
          onEnabledToggle={onEnabledToggle}
          pillPopover={pillPopover}
          trailingControl={trailingControl}
          reserveTrailingSlot={reserveTrailingSlot}
        />
      </div>
      {body ? <div className="prototype-section-card__body">{body}</div> : null}
    </section>
  );
}

export function ExactInlineRowShell({
  label,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  style,
}: ExactInlineRowShellProps) {
  return (
    <div className="prototype-region-row" style={style}>
      <span className="color-control__label color-control__label--region">
        {label}
      </span>
      <ExactMetaControls
        enabled={enabled}
        toggleState={toggleState}
        onEnabledToggle={onEnabledToggle}
        pillPopover={pillPopover}
        trailingControl={trailingControl}
      />
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
      className={`prototype-control-section${
        enabled ? '' : ' prototype-control-section--disabled'
      }`}
    >
      <div className="prototype-popover__section-title">{title}</div>
      {onToggle ? (
        <div className="prototype-control-section__toggle">
          <ExactToggleButton
            enabled={enabled}
            state={toggleState}
            onClick={onToggle}
          />
        </div>
      ) : null}
      <div
        className="prototype-control-section__content"
        aria-disabled={enabled ? undefined : 'true'}
      >
        {children}
      </div>
    </section>
  );
}

export function ExactFieldSections({
  sections,
  ariaLabelPrefix,
}: ExactFieldSectionsProps) {
  return (
    <>
      {sections.map((section) => {
        const enabledState = section.enabledState;
        const onEnabledChange = section.onEnabledChange;
        const onToggle =
          enabledState !== undefined && onEnabledChange
            ? () => onEnabledChange(enabledState !== 'on')
            : undefined;

        return (
          <ExactControlSection
            key={section.title}
            title={section.title}
            enabled={enabledState !== 'off'}
            toggleState={enabledState}
            onToggle={onToggle}
          >
            {section.fields.map((field) => (
              <ExactField
                key={field.kind === 'shape' ? field.label : field.id}
                field={field}
                ariaLabelPrefix={`${ariaLabelPrefix} ${section.title}`}
              />
            ))}
          </ExactControlSection>
        );
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
      <div className="prototype-control-field">
        <label className="field-label" htmlFor={field.id}>
          {field.label}
        </label>
        <div className="prototype-color-field__control">
          <span
            className="prototype-color-field__preview"
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
            className="color-input color-input--popover prototype-color-field__input"
            type="color"
            value={field.value}
            onChange={(event) => field.onChange(event.currentTarget.value)}
            aria-label={`${ariaLabelPrefix} ${field.label}`}
          />
        </div>
      </div>
    );
  }

  if (field.kind === 'shape') {
    return (
      <div className="prototype-control-field">
        <span className="field-label">{field.label}</span>
        <div className="prototype-shape-picker" role="group" aria-label={`${ariaLabelPrefix} ${field.label}`}>
          {(['circle', 'square', 'diamond', 'triangle'] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              className={`prototype-shape-button${
                field.value === shape ? ' is-selected' : ''
              }`}
              onClick={() => field.onChange(shape)}
              aria-pressed={field.value === shape}
              aria-label={`${ariaLabelPrefix} ${field.label} ${shape}`}
            >
              <span className={`prototype-shape-icon prototype-shape-icon--${shape}`} aria-hidden="true">
                {shape === 'circle' ? '●' : shape === 'square' ? '■' : shape === 'diamond' ? '◆' : '▲'}
              </span>
            </button>
          ))}
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
    <div className="prototype-control-field">
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

export function ExactPopover({
  open,
  onOpenChange,
  trigger,
  children,
  scrollContainer,
  portalContainer,
  viewportContainer,
  triangleMinRatio,
  triangleMaxRatio,
}: ExactPopoverProps) {
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

      const placement = computeFloatingCalloutPlacement({
        triggerRect: triggerElement.getBoundingClientRect(),
        contentRect: contentElement.getBoundingClientRect(),
        viewportRect: viewportElement.getBoundingClientRect(),
        portalRect: portalContainer?.getBoundingClientRect(),
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

function buildColorPreviewBackground(
  value: string,
  opacityPreview?: number,
  mixedSwatches?: SidebarControlFieldDefinition extends infer T
    ? T extends { kind: 'color'; mixedSwatches?: infer M }
      ? M
      : never
    : never,
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
