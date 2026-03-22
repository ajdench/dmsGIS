import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import {
  computeExactFloatingCalloutPlacement,
} from './floatingCallout';
import { ExactMetricPill } from './ExactMetricPill';
import type { ExactPillPopoverProps, ExactPopoverProps } from './types';

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

      if (!triggerElement || !contentElement || !sidebarElement || !viewportElement) {
        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const viewportRect = viewportElement.getBoundingClientRect();
      const portalRect = portalContainer?.getBoundingClientRect();
      const placement = computeExactFloatingCalloutPlacement({
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
        ['--sidebar-exact-popover-triangle-y' as string]: `${placement.triangleCenter}px`,
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
    <div className="sidebar-exact-popover-anchor">
      <div
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        className="sidebar-exact-popover-anchor__trigger"
      >
        {trigger}
      </div>
      {open
        ? createPortal(
            <div
              ref={contentRef}
              className="sidebar-exact-popover sidebar-exact-popover--floating"
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

export function ExactPillPopover({
  open,
  onOpenChange,
  value,
  swatch,
  summary,
  debugCircleOverlay,
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
          value={summary?.valueLabel ?? value}
          swatch={summary?.swatch ? undefined : swatch}
          summary={summary}
          debugCircleOverlay={debugCircleOverlay}
          asButton
          ariaExpanded={open}
          ariaHaspopup="dialog"
        />
      }
    >
      <div className="sidebar-exact-popover__content">{children}</div>
    </ExactPopover>
  );
}
