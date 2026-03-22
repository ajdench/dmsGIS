import {
  createPortal,
} from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { computeFloatingCalloutPlacement } from '../../lib/sidebar/floatingCallout';

interface SidebarPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
}

export function SidebarPopover({
  open,
  onOpenChange,
  trigger,
  children,
}: SidebarPopoverProps) {
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

      const triggerRect = triggerElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const viewportRect = viewportElement.getBoundingClientRect();
      const portalRect =
        portalElement === document.body
          ? null
          : portalElement.getBoundingClientRect();

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
        ['--sidebar-popover-triangle-y' as string]: `${placement.triangleCenter}px`,
      });
    };

    updatePosition();

    let frameId: number | null = null;
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updatePosition();
      });
    };

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    const sidebarElement =
      triggerRef.current?.closest('.sidebar--right') as HTMLElement | null;
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
    if (!open) return;

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
    <div className="sidebar-popover-anchor">
      <div
        ref={triggerRef}
        className="sidebar-popover-anchor__trigger"
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </div>
      {open
        ? createPortal(
            <div
              ref={contentRef}
              className="sidebar-popover sidebar-popover--floating"
              style={positionStyle ?? undefined}
            >
              <div className="sidebar-popover__content">{children}</div>
            </div>,
            ((triggerRef.current?.closest('.workspace-grid') as HTMLElement | null) ??
              document.body),
          )
        : null}
    </div>
  );
}
