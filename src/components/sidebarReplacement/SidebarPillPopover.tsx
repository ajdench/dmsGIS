import { createPortal } from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { SidebarPillSummary } from '../../lib/sidebar/contracts';
import { computeFloatingCalloutPlacement } from '../../lib/sidebar/floatingCallout';
import { SidebarCallout } from './SidebarCallout';
import { SidebarMetricPill } from './SidebarMetricPill';

interface SidebarPillPopoverProps {
  summary: SidebarPillSummary;
  children: ReactNode;
}

export function SidebarPillPopover({
  summary,
  children,
}: SidebarPillPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [positionStyle, setPositionStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const triggerElement = triggerRef.current;
      const contentElement = contentRef.current;
      const sidebarElement =
        triggerElement?.closest('.sidebar--right') as HTMLElement | null;
      const viewportElement = sidebarElement;
      const portalElement =
        (triggerElement?.closest('.workspace-grid') as HTMLElement | null) ??
        document.body;

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
        portalRect:
          portalElement === document.body
            ? null
            : portalElement.getBoundingClientRect(),
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

    const sidebarElement =
      triggerRef.current?.closest('.sidebar--right') as HTMLElement | null;
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    sidebarElement?.addEventListener('scroll', scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      sidebarElement?.removeEventListener('scroll', scheduleUpdate);
    };
  }, [open]);

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
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const portalTarget =
    (triggerRef.current?.closest('.workspace-grid') as HTMLElement | null) ??
    (typeof document === 'undefined' ? null : document.body);

  return (
    <div className="sidebar-replacement-popover-anchor">
      <button
        ref={triggerRef}
        type="button"
        className="sidebar-replacement-pill-button-reset"
        aria-label={summary.ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <SidebarMetricPill summary={summary} trigger />
      </button>
      {open && portalTarget
        ? createPortal(
            <div ref={contentRef}>
              <SidebarCallout open={open} style={positionStyle ?? undefined}>
                {children}
              </SidebarCallout>
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
