import {
  createPortal,
} from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
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
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [positionStyle, setPositionStyle] = useState<CSSProperties | null>(null);
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  const sidebarElement = useMemo(
    () => anchorRef.current?.closest('.sidebar--right') as HTMLElement | null,
    [open],
  );

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !contentRef.current || !sidebarElement) {
      return;
    }

    const updatePosition = () => {
      const triggerRect = anchorRef.current?.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect();
      const viewportRect = sidebarElement.getBoundingClientRect();
      if (!triggerRect || !contentRect) {
        return;
      }

      const placement = computeFloatingCalloutPlacement({
        triggerRect,
        contentRect,
        viewportRect,
      });

      setPositionStyle({
        position: 'fixed',
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
    sidebarElement.addEventListener('scroll', scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      sidebarElement.removeEventListener('scroll', scheduleUpdate);
    };
  }, [open, sidebarElement]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !anchorRef.current?.contains(target) &&
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
        ref={anchorRef}
        className="sidebar-popover-anchor__trigger"
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </div>
      {open && portalTarget
        ? createPortal(
            <div
              ref={contentRef}
              className="sidebar-popover sidebar-popover--floating"
              style={positionStyle ?? undefined}
            >
              <div className="sidebar-popover__content">{children}</div>
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
