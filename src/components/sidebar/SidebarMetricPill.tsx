import type { SidebarPillSummary } from '../../lib/sidebar/contracts';

interface SidebarMetricPillProps {
  summary: SidebarPillSummary;
  asButton?: boolean;
  expanded?: boolean;
}

export function SidebarMetricPill({
  summary,
  asButton = false,
  expanded,
}: SidebarMetricPillProps) {
  const className = `sidebar-metric-pill${
    asButton ? ' sidebar-metric-pill--button' : ''
  }${summary.swatch ? ' sidebar-metric-pill--swatch' : ''}`;
  const swatch = summary.swatch;

  return (
    <span
      className={className}
      aria-label={asButton ? summary.ariaLabel : undefined}
      aria-expanded={asButton ? expanded : undefined}
      aria-haspopup={asButton ? 'dialog' : undefined}
      role={asButton ? 'button' : undefined}
    >
      {swatch ? (
        <span
          className={`sidebar-metric-pill__swatch${
            swatch.shape ? ` is-${swatch.shape}` : ''
          }`}
          style={{
            background: buildSwatchBackground(swatch),
            opacity: swatch.opacity ?? 1,
            borderColor: swatch.borderColor,
            borderWidth: swatch.borderWidth,
          }}
          aria-hidden="true"
        />
      ) : null}
      <span className="sidebar-metric-pill__value">{summary.valueLabel}</span>
    </span>
  );
}

function buildSwatchBackground(
  swatch: NonNullable<SidebarPillSummary['swatch']>,
): string {
  if (swatch.mix && swatch.mix.length > 0) {
    const stops = swatch.mix.slice(0, 4).map((stop, index, array) => {
      const color = applyOpacity(stop.color, stop.opacity ?? 1);
      const start = (index / array.length) * 100;
      const end = ((index + 1) / array.length) * 100;
      return `${color} ${start}% ${end}%`;
    });

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  return `linear-gradient(${applyOpacity(swatch.color, swatch.opacity ?? 1)}, ${applyOpacity(swatch.color, swatch.opacity ?? 1)})`;
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
