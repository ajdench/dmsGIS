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
    <div className="sidebar-inline-row">
      <span className="sidebar-inline-row__label">{label}</span>
      <span className="sidebar-inline-row__meta">
        <button
          type="button"
          className={`sidebar-toggle-button${enabled ? ' is-on' : ' is-off'}`}
          onClick={() => onEnabledChange(!enabled)}
          aria-label={`${label} visible`}
          aria-pressed={enabled}
        >
          {enabled ? 'On' : 'Off'}
        </button>
        <details className="color-popover sidebar-control-row__meta" ref={detailsRef}>
          <summary
            className="sidebar-metric-pill sidebar-metric-pill--button"
            aria-label={pillAriaLabel}
          >
            {swatchColor ? (
              <span
                className="sidebar-metric-pill__swatch"
                style={{ backgroundColor: swatchColor, opacity: swatchOpacity }}
                aria-hidden="true"
              />
            ) : null}
            <span className="sidebar-metric-pill__value">{pillLabel}</span>
          </summary>
          <div className="color-popover__panel sidebar-control-row__panel">{children}</div>
        </details>
      </span>
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
