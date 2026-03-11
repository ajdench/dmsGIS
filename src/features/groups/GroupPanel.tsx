import { useEffect, useMemo, useRef, useState } from 'react';
import { SliderField } from '../../components/controls/SliderField';
import { useAppStore } from '../../store/appStore';
import type { FacilitySymbolShape, RegionStyle } from '../../types';

const REGION_ORDER = [
  'Scotland & Northern Ireland',
  'North',
  'Wales & West Midlands',
  'East',
  'South West',
  'Central & Wessex',
  'London & South',
] as const;

interface GroupPanelProps {
  embedded?: boolean;
  mode?: 'pmc' | 'regions';
}

export function GroupPanel({
  embedded = false,
  mode = 'pmc',
}: GroupPanelProps) {
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const regions = useAppStore((state) => state.regions);
  const regionGlobalOpacity = useAppStore((state) => state.regionGlobalOpacity);
  const facilitySymbolShape = useAppStore((state) => state.facilitySymbolShape);
  const facilitySymbolSize = useAppStore((state) => state.facilitySymbolSize);
  const setRegionVisibility = useAppStore((state) => state.setRegionVisibility);
  const setRegionColor = useAppStore((state) => state.setRegionColor);
  const setRegionOpacity = useAppStore((state) => state.setRegionOpacity);
  const setRegionBorderVisibility = useAppStore(
    (state) => state.setRegionBorderVisibility,
  );
  const setRegionBorderColor = useAppStore((state) => state.setRegionBorderColor);
  const setRegionBorderOpacity = useAppStore(
    (state) => state.setRegionBorderOpacity,
  );
  const setRegionSymbolSize = useAppStore((state) => state.setRegionSymbolSize);
  const setRegionGlobalOpacity = useAppStore(
    (state) => state.setRegionGlobalOpacity,
  );
  const setAllRegionVisibility = useAppStore((state) => state.setAllRegionVisibility);
  const setAllRegionBorderColor = useAppStore(
    (state) => state.setAllRegionBorderColor,
  );
  const setAllRegionBorderOpacity = useAppStore(
    (state) => state.setAllRegionBorderOpacity,
  );
  const setFacilitySymbolShape = useAppStore(
    (state) => state.setFacilitySymbolShape,
  );
  const setFacilitySymbolSize = useAppStore((state) => state.setFacilitySymbolSize);
  const regionBoundaryLayers = useAppStore((state) => state.regionBoundaryLayers);
  const setRegionBoundaryLayerVisibility = useAppStore(
    (state) => state.setRegionBoundaryLayerVisibility,
  );
  const setRegionBoundaryLayerOpacity = useAppStore(
    (state) => state.setRegionBoundaryLayerOpacity,
  );
  const setRegionBoundaryLayerBorderVisibility = useAppStore(
    (state) => state.setRegionBoundaryLayerBorderVisibility,
  );
  const setRegionBoundaryLayerBorderColor = useAppStore(
    (state) => state.setRegionBoundaryLayerBorderColor,
  );
  const setRegionBoundaryLayerBorderOpacity = useAppStore(
    (state) => state.setRegionBoundaryLayerBorderOpacity,
  );

  const sortedRegions = useMemo(() => sortRegions(regions), [regions]);
  const pmcVisible = regions.length > 0 && regions.some((region) => region.visible);
  const pmcBorderColor = getUniformRegionValue(
    regions,
    (region) => region.borderColor,
    '#cbd5e1',
  );
  const pmcBorderOpacity = getUniformRegionValue(
    regions,
    (region) => region.borderOpacity,
    0,
  );
  const [pmcPopoverOpen, setPmcPopoverOpen] = useState(false);
  const pmcPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!pmcPopoverOpen) return;
      const target = event.target;
      if (
        target instanceof Node &&
        pmcPopoverRef.current &&
        !pmcPopoverRef.current.contains(target)
      ) {
        setPmcPopoverOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [pmcPopoverOpen]);

  const facilityRegionRows = (
    <>
      {regions.length === 0 && <p className="muted">No regions loaded.</p>}
      <div className="stack-col">
        {sortedRegions.map((region) => (
          <RegionPopover
            key={region.name}
            name={region.name}
            color={region.color}
            opacity={region.opacity}
            visible={region.visible}
            borderVisible={region.borderVisible}
            borderColor={region.borderColor}
            borderOpacity={region.borderOpacity}
            symbolSize={region.symbolSize}
            onVisibilityChange={(checked) =>
              setRegionVisibility(region.name, checked)
            }
            onColorChange={(color) => setRegionColor(region.name, color)}
            onOpacityChange={(opacity) => setRegionOpacity(region.name, opacity)}
            onBorderVisibilityChange={(checked) =>
              setRegionBorderVisibility(region.name, checked)
            }
            onBorderColorChange={(color) => setRegionBorderColor(region.name, color)}
            onBorderOpacityChange={(opacity) =>
              setRegionBorderOpacity(region.name, opacity)
            }
            onSymbolSizeChange={(size) => setRegionSymbolSize(region.name, size)}
          />
        ))}
      </div>
    </>
  );

  const boundaryRegionsContent = (
    <div className="stack-col">
      {regionBoundaryLayers.map((layer) => (
        <RegionBoundaryPopover
          key={layer.id}
          title={layer.name}
          visible={layer.visible}
          opacity={layer.opacity}
          borderVisible={layer.borderVisible}
          borderColor={layer.borderColor}
          borderOpacity={layer.borderOpacity}
          onVisibilityChange={(checked) =>
            setRegionBoundaryLayerVisibility(layer.id, checked)
          }
          onOpacityChange={(value) => setRegionBoundaryLayerOpacity(layer.id, value)}
          onBorderVisibilityChange={(checked) =>
            setRegionBoundaryLayerBorderVisibility(layer.id, checked)
          }
          onBorderColorChange={(color) =>
            setRegionBoundaryLayerBorderColor(layer.id, color)
          }
          onBorderOpacityChange={(value) =>
            setRegionBoundaryLayerBorderOpacity(layer.id, value)
          }
        />
      ))}
    </div>
  );

  const pmcSection = (
    <details className="group-section" open>
      <summary className="group-section__summary">
        <span className="group-section__title">PMC</span>
        <div className="group-section__summary-actions" ref={pmcPopoverRef}>
          <button
            type="button"
            className="color-popover__summary color-popover__summary--fixed"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPmcPopoverOpen((open) => !open);
            }}
            aria-label="PMC controls"
            aria-expanded={pmcPopoverOpen}
          >
            <span
              className="color-popover__swatch"
              style={{ backgroundColor: pmcBorderColor }}
              aria-hidden="true"
            />
            <span className="color-popover__percent">
              {Math.round(regionGlobalOpacity * 100)}%
            </span>
          </button>
          {pmcPopoverOpen && (
            <div className="color-popover__panel group-section__popover-panel">
              <label className="stack-row stack-row--tight popover-section__title popover-head">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={pmcVisible}
                  onChange={(event) =>
                    setAllRegionVisibility(event.currentTarget.checked)
                  }
                  aria-label="PMC visible"
                />
                <span>Visible</span>
              </label>
              <div className="popover-section">
                <label className="field-label" htmlFor="pmc-symbol-shape">
                  Shape
                </label>
                <select
                  id="pmc-symbol-shape"
                  className="select select--centered"
                  value={facilitySymbolShape}
                  onChange={(event) =>
                    setFacilitySymbolShape(
                      event.currentTarget.value as FacilitySymbolShape,
                    )
                  }
                  aria-label="PMC shape"
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="diamond">Diamond</option>
                  <option value="triangle">Triangle</option>
                </select>
                <label className="field-label" htmlFor="pmc-symbol-size">
                  Size
                </label>
                <SliderField
                  id="pmc-symbol-size"
                  min={1}
                  max={12}
                  step={0.5}
                  value={facilitySymbolSize}
                  onChange={setFacilitySymbolSize}
                  ariaLabel="PMC size"
                />
                <label className="field-label" htmlFor="pmc-global-opacity">
                  Opacity
                </label>
                <SliderField
                  id="pmc-global-opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={regionGlobalOpacity}
                  onChange={setRegionGlobalOpacity}
                  ariaLabel="PMC global opacity"
                  mode="percent"
                />
              </div>
              <div className="popover-section">
                <label className="field-label" htmlFor="pmc-border-color">
                  Border
                </label>
                <input
                  id="pmc-border-color"
                  className="color-input color-input--popover"
                  type="color"
                  value={pmcBorderColor}
                  onChange={(event) =>
                    setAllRegionBorderColor(event.currentTarget.value)
                  }
                  aria-label="PMC border colour"
                />
                <label className="field-label" htmlFor="pmc-border-opacity">
                  Opacity
                </label>
                <SliderField
                  id="pmc-border-opacity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={pmcBorderOpacity}
                  onChange={setAllRegionBorderOpacity}
                  ariaLabel="PMC border opacity"
                  mode="percent"
                />
              </div>
            </div>
          )}
        </div>
      </summary>
      <div className="group-section__body">{facilityRegionRows}</div>
    </details>
  );

  const content = (
    <>
      {!embedded && <h2>Overlays</h2>}
      {mode === 'pmc'
        ? pmcSection
        : activeViewPreset === 'current'
          ? boundaryRegionsContent
          : null}
    </>
  );

  if (embedded) {
    return content;
  }

  return <section className="panel panel--regions">{content}</section>;
}

interface RegionBoundaryPopoverProps {
  title: string;
  visible: boolean;
  opacity: number;
  borderVisible: boolean;
  borderColor: string;
  borderOpacity: number;
  onVisibilityChange: (checked: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onBorderVisibilityChange: (checked: boolean) => void;
  onBorderColorChange: (color: string) => void;
  onBorderOpacityChange: (opacity: number) => void;
}

function RegionBoundaryPopover({
  title,
  visible,
  opacity,
  borderVisible,
  borderColor,
  borderOpacity,
  onVisibilityChange,
  onOpacityChange,
  onBorderVisibilityChange,
  onBorderColorChange,
  onBorderOpacityChange,
}: RegionBoundaryPopoverProps) {
  const detailsRef = useOutsideClose();
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="color-control">
      <span className="color-control__label color-control__label--region">{title}</span>
      <details className="color-popover" ref={detailsRef}>
        <summary className="color-popover__summary">
          <span className="color-popover__percent">{Math.round(opacity * 100)}%</span>
        </summary>
        <div className="color-popover__panel">
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={visible}
                onChange={(event) => onVisibilityChange(event.currentTarget.checked)}
                aria-label={`${title} visible`}
              />
              <span>Visible</span>
            </label>
          </div>
          <div className="popover-section">
            <label className="field-label" htmlFor={`${slug}-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={onOpacityChange}
              ariaLabel={`${title} opacity`}
              mode="percent"
            />
          </div>
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={borderVisible}
                onChange={(event) =>
                  onBorderVisibilityChange(event.currentTarget.checked)
                }
                aria-label={`${title} border visible`}
              />
              <span>Border</span>
            </label>
            <label className="field-label" htmlFor={`${slug}-border-color`}>
              Colour
            </label>
            <input
              id={`${slug}-border-color`}
              className="color-input color-input--popover"
              type="color"
              value={borderColor}
              onChange={(event) => onBorderColorChange(event.currentTarget.value)}
              aria-label={`${title} border colour`}
            />
            <label className="field-label" htmlFor={`${slug}-border-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-border-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={borderOpacity}
              onChange={onBorderOpacityChange}
              ariaLabel={`${title} border opacity`}
              mode="percent"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

interface RegionPopoverProps {
  name: string;
  color: string;
  opacity: number;
  visible: boolean;
  borderVisible: boolean;
  borderColor: string;
  borderOpacity: number;
  symbolSize: number;
  onVisibilityChange: (checked: boolean) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  onBorderVisibilityChange: (checked: boolean) => void;
  onBorderColorChange: (color: string) => void;
  onBorderOpacityChange: (opacity: number) => void;
  onSymbolSizeChange: (size: number) => void;
}

function RegionPopover({
  name,
  color,
  opacity,
  visible,
  borderVisible,
  borderColor,
  borderOpacity,
  symbolSize,
  onVisibilityChange,
  onColorChange,
  onOpacityChange,
  onBorderVisibilityChange,
  onBorderColorChange,
  onBorderOpacityChange,
  onSymbolSizeChange,
}: RegionPopoverProps) {
  const detailsRef = useOutsideClose();
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="color-control">
      <span className="color-control__label color-control__label--region">{name}</span>
      <details className="color-popover" ref={detailsRef}>
        <summary className="color-popover__summary color-popover__summary--fixed">
          <span
            className="color-popover__swatch"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="color-popover__percent">{Math.round(opacity * 100)}%</span>
        </summary>
        <div className="color-popover__panel">
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={visible}
                onChange={(event) => onVisibilityChange(event.currentTarget.checked)}
                aria-label={`${name} visible`}
              />
              <span>Visible</span>
            </label>
          </div>
          <div className="popover-section">
            <label className="field-label" htmlFor={`${slug}-color`}>
              Colour
            </label>
            <input
              id={`${slug}-color`}
              className="color-input color-input--popover"
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.currentTarget.value)}
              aria-label={`${name} colour`}
            />
            <label className="field-label" htmlFor={`${slug}-size`}>
              Size
            </label>
            <SliderField
              id={`${slug}-size`}
              min={1}
              max={12}
              step={0.5}
              value={symbolSize}
              onChange={onSymbolSizeChange}
              ariaLabel={`${name} size`}
            />
            <label className="field-label" htmlFor={`${slug}-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={onOpacityChange}
              ariaLabel={`${name} opacity`}
              mode="percent"
            />
          </div>
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={borderVisible}
                onChange={(event) =>
                  onBorderVisibilityChange(event.currentTarget.checked)
                }
                aria-label={`${name} border visible`}
              />
              <span>Border</span>
            </label>
            <label className="field-label" htmlFor={`${slug}-border-color`}>
              Colour
            </label>
            <input
              id={`${slug}-border-color`}
              className="color-input color-input--popover"
              type="color"
              value={borderColor}
              onChange={(event) => onBorderColorChange(event.currentTarget.value)}
              aria-label={`${name} border colour`}
            />
            <label className="field-label" htmlFor={`${slug}-border-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-border-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={borderOpacity}
              onChange={onBorderOpacityChange}
              ariaLabel={`${name} border opacity`}
              mode="percent"
            />
          </div>
        </div>
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

function sortRegions<T extends { name: string }>(regions: T[]): T[] {
  return [...regions].sort((a, b) => {
    const indexA = REGION_ORDER.indexOf(a.name as (typeof REGION_ORDER)[number]);
    const indexB = REGION_ORDER.indexOf(b.name as (typeof REGION_ORDER)[number]);
    const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });
}

function getUniformRegionValue<T>(
  regions: RegionStyle[],
  getValue: (region: RegionStyle) => T,
  fallback: T,
): T {
  if (regions.length === 0) {
    return fallback;
  }

  const firstValue = getValue(regions[0]);
  return regions.every((region) => getValue(region) === firstValue)
    ? firstValue
    : fallback;
}
