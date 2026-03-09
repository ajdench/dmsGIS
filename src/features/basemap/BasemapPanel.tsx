import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { SliderField } from '../../components/controls/SliderField';

export function BasemapPanel() {
  const basemap = useAppStore((state) => state.basemap);
  const setBasemapElementColor = useAppStore(
    (state) => state.setBasemapElementColor,
  );
  const setBasemapElementOpacity = useAppStore(
    (state) => state.setBasemapElementOpacity,
  );
  const setBasemapLayerVisibility = useAppStore(
    (state) => state.setBasemapLayerVisibility,
  );

  return (
    <section className="panel panel--basemap">
      <h2>Basemap</h2>
      <div className="stack-col">
        <ElementPopover
          title="Land"
          swatchColor={basemap.landFillColor}
          swatchOpacity={basemap.landFillOpacity}
          sections={[
            {
              title: 'Fill',
              enabled: basemap.showLandFill,
              color: basemap.landFillColor,
              opacity: basemap.landFillOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showLandFill', checked),
              onColorChange: (color) =>
                setBasemapElementColor('landFillColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('landFillOpacity', opacity),
            },
            {
              title: 'Borders',
              enabled: basemap.showCountryBorders,
              color: basemap.countryBorderColor,
              opacity: basemap.countryBorderOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showCountryBorders', checked),
              onColorChange: (color) =>
                setBasemapElementColor('countryBorderColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('countryBorderOpacity', opacity),
            },
            {
              title: 'Labels',
              enabled: basemap.showCountryLabels,
              color: basemap.countryLabelColor,
              opacity: basemap.countryLabelOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showCountryLabels', checked),
              onColorChange: (color) =>
                setBasemapElementColor('countryLabelColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('countryLabelOpacity', opacity),
            },
            {
              title: 'Major cities',
              enabled: basemap.showMajorCities,
              color: basemap.majorCityColor,
              opacity: basemap.majorCityOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showMajorCities', checked),
              onColorChange: (color) =>
                setBasemapElementColor('majorCityColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('majorCityOpacity', opacity),
            },
          ]}
        />
        <ElementPopover
          title="Sea"
          swatchColor={basemap.seaFillColor}
          swatchOpacity={basemap.seaFillOpacity}
          sections={[
            {
              title: 'Fill',
              enabled: basemap.showSeaFill,
              color: basemap.seaFillColor,
              opacity: basemap.seaFillOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showSeaFill', checked),
              onColorChange: (color) =>
                setBasemapElementColor('seaFillColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('seaFillOpacity', opacity),
            },
            {
              title: 'Labels',
              enabled: basemap.showSeaLabels,
              color: basemap.seaLabelColor,
              opacity: basemap.seaLabelOpacity,
              onEnabledChange: (checked) =>
                setBasemapLayerVisibility('showSeaLabels', checked),
              onColorChange: (color) =>
                setBasemapElementColor('seaLabelColor', color),
              onOpacityChange: (opacity) =>
                setBasemapElementOpacity('seaLabelOpacity', opacity),
            },
          ]}
        />
      </div>
    </section>
  );
}

interface ElementSection {
  title: string;
  enabled: boolean;
  color: string;
  opacity: number;
  onEnabledChange: (checked: boolean) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}

interface ElementPopoverProps {
  title: string;
  swatchColor: string;
  swatchOpacity: number;
  sections: ElementSection[];
}

function ElementPopover({
  title,
  swatchColor,
  swatchOpacity,
  sections,
}: ElementPopoverProps) {
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

  return (
    <div className="color-control">
      <span className="color-control__label">{title}</span>
      <details className="color-popover" ref={detailsRef}>
        <summary className="color-popover__summary color-popover__summary--fixed">
          <span
            className="color-popover__swatch"
            style={{ backgroundColor: swatchColor }}
            aria-hidden="true"
          />
          <span className="color-popover__percent">
            {Math.round(swatchOpacity * 100)}%
          </span>
        </summary>
        <div className="color-popover__panel">
          {sections.map((section) => {
            const slug = `${title}-${section.title}`
              .toLowerCase()
              .replace(/\s+/g, '-');
            return (
              <div key={section.title} className="popover-section">
              <label className="stack-row stack-row--tight popover-section__title">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(event) =>
                    section.onEnabledChange(event.currentTarget.checked)
                  }
                />
                <span>{section.title}</span>
              </label>
              <label className="field-label" htmlFor={`${slug}-color`}>
                Colour
              </label>
              <input
                id={`${slug}-color`}
                className="color-input color-input--popover"
                type="color"
                value={section.color}
                onChange={(event) => section.onColorChange(event.currentTarget.value)}
                aria-label={`${title} ${section.title} colour`}
              />
              <label className="field-label" htmlFor={`${slug}-opacity`}>
                Opacity
              </label>
              <SliderField
                id={`${slug}-opacity`}
                min={0}
                max={1}
                step={0.05}
                value={section.opacity}
                onChange={section.onOpacityChange}
                ariaLabel={`${title} ${section.title} opacity`}
                mode="percent"
              />
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
