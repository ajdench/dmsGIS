import { useEffect, useRef, type ReactNode } from 'react';

interface SidebarControlRowProps {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  pillLabel: string;
  pillAriaLabel: string;
  swatchColor?: string;
  swatchOpacity?: number;
  children: ReactNode;
}

export function SidebarControlRow({
  label,
  enabled,
  onEnabledChange,
  pillLabel,
  pillAriaLabel,
  swatchColor,
  swatchOpacity = 1,
  children,
}: SidebarControlRowProps) {
  const detailsRef = useOutsideClose();

  return (
    <div className="color-control sidebar-control-row">
      <label className="stack-row stack-row--tight color-control__label sidebar-control-row__label">
        <input
          className="checkbox"
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.currentTarget.checked)}
          aria-label={`${label} visible`}
        />
        <span>{label}</span>
      </label>
      <details className="color-popover sidebar-control-row__meta" ref={detailsRef}>
        <summary
          className="color-popover__summary color-popover__summary--fixed"
          aria-label={pillAriaLabel}
        >
          {swatchColor ? (
            <span
              className="color-popover__swatch"
              style={{ backgroundColor: swatchColor, opacity: swatchOpacity }}
              aria-hidden="true"
            />
          ) : (
            <span className="color-popover__swatch" aria-hidden="true" />
          )}
          <span className="color-popover__percent">{pillLabel}</span>
        </summary>
        <div className="color-popover__panel">{children}</div>
      </details>
    </div>
  );
}

function useOutsideClose() {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      const target = event.target;
      if (target instanceof Node && !details.contains(target)) {
        details.removeAttribute('open');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return detailsRef;
}
