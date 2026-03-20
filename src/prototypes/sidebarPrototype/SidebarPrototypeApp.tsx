import { useState } from 'react';
import { VIEW_PRESET_BUTTONS } from '../../lib/config/viewPresets';
import { PrototypeAccordion, PrototypeAccordionItem } from './PrototypeAccordion';
import {
  BASEMAP_SIMPLE_SECTIONS,
  buildInitialRegionEnabled,
  DEFAULT_BASEMAP_SECTIONS,
  DEFAULT_FACILITY_SECTIONS,
  DEFAULT_LABEL_SECTIONS,
  DEFAULT_OPEN_PANES,
  DEFAULT_OVERLAY_SECTIONS,
  INITIAL_OVERLAY_ROW_ENABLED,
  INITIAL_PANE_ENABLED,
  INITIAL_SECTION_ENABLED,
  LABEL_SIMPLE_SECTIONS,
  OVERLAY_ROWS,
  REGION_ROWS,
} from './data';
import {
  PrototypeColorField,
  PrototypeControlField,
  PrototypeControlSection,
  PrototypeMetricPill,
  PrototypePopover,
  type PrototypeShape,
  type SwatchStop,
  PrototypeShapePicker,
  PrototypeSliderControl,
  PrototypeStaticRow,
  PrototypeToggleButton,
} from './PrototypeControls';

type LabelSectionId = (typeof LABEL_SIMPLE_SECTIONS)[number]['id'];

interface RegionStyleState {
  shape: PrototypeShape;
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

interface LabelStyleState {
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

type LabelStyleKey = keyof LabelStyleState;
type LabelStylesRecord = Record<LabelSectionId, LabelStyleState>;

type RegionStyleKey =
  | 'shape'
  | 'size'
  | 'opacity'
  | 'color'
  | 'borderColor'
  | 'borderWidth'
  | 'borderOpacity';

const INITIAL_FACILITY_STYLE: RegionStyleState = {
  shape: 'circle',
  size: 3.5,
  opacity: 0.75,
  color: '#ed5151',
  borderColor: '#cbd5e1',
  borderWidth: 1,
  borderOpacity: 0.2,
};

const INITIAL_LABEL_STYLES: LabelStylesRecord = {
  'country-labels': {
    size: 8,
    opacity: 0.4,
    color: '#0f172a',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.3,
  },
  'major-cities': {
    size: 6,
    opacity: 0.65,
    color: '#1f2937',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.35,
  },
};

function buildInitialRegionStyles() {
  return Object.fromEntries(
    REGION_ROWS.map((region) => [region, { ...INITIAL_FACILITY_STYLE }]),
  ) as Record<string, RegionStyleState>;
}

function buildInitialLabelStyles() {
  return structuredClone(INITIAL_LABEL_STYLES);
}

function getMixedRegionColors(
  regionStyles: Record<string, RegionStyleState>,
  key: 'color' | 'borderColor',
) {
  const opacityKey = key === 'color' ? 'opacity' : 'borderOpacity';
  const colors = Array.from(
    new Map(
      Object.values(regionStyles).map((style) => [
        `${style[key]}|${style[opacityKey]}`,
        {
          color: style[key],
          opacity: style[opacityKey],
        },
      ]),
    ).values(),
  );

  return colors.length > 1 ? colors : undefined;
}

export function SidebarPrototypeApp() {
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [openPanes, setOpenPanes] = useState<string[]>(DEFAULT_OPEN_PANES);
  const [openBasemapSections, setOpenBasemapSections] = useState<string[]>(
    DEFAULT_BASEMAP_SECTIONS,
  );
  const [openFacilitySections, setOpenFacilitySections] = useState<string[]>(
    DEFAULT_FACILITY_SECTIONS,
  );
  const [openLabelSections, setOpenLabelSections] = useState<string[]>(
    DEFAULT_LABEL_SECTIONS,
  );
  const [openOverlaySections, setOpenOverlaySections] = useState<string[]>(
    DEFAULT_OVERLAY_SECTIONS,
  );
  const [activePreset, setActivePreset] = useState('current');
  const [landOpacity, setLandOpacity] = useState(0.84);
  const [seaOpacity, setSeaOpacity] = useState(0.78);
  const [facilityShape, setFacilityShape] = useState<PrototypeShape>(
    INITIAL_FACILITY_STYLE.shape,
  );
  const [facilitySymbolSize, setFacilitySymbolSize] = useState(
    INITIAL_FACILITY_STYLE.size,
  );
  const [facilityColor, setFacilityColor] = useState(INITIAL_FACILITY_STYLE.color);
  const [facilityOpacity, setFacilityOpacity] = useState(
    INITIAL_FACILITY_STYLE.opacity,
  );
  const [facilityBorderColor, setFacilityBorderColor] = useState(
    INITIAL_FACILITY_STYLE.borderColor,
  );
  const [facilityBorderWidth, setFacilityBorderWidth] = useState(
    INITIAL_FACILITY_STYLE.borderWidth,
  );
  const [facilityBorderOpacity, setFacilityBorderOpacity] = useState(
    INITIAL_FACILITY_STYLE.borderOpacity,
  );
  const [paneEnabled, setPaneEnabled] =
    useState<Record<string, boolean>>(INITIAL_PANE_ENABLED);
  const [sectionEnabled, setSectionEnabled] =
    useState<Record<string, boolean>>(INITIAL_SECTION_ENABLED);
  const [regionEnabled, setRegionEnabled] =
    useState<Record<string, boolean>>(buildInitialRegionEnabled);
  const [overlayRowEnabled, setOverlayRowEnabled] =
    useState<Record<string, boolean>>(INITIAL_OVERLAY_ROW_ENABLED);
  const [openRegionPopover, setOpenRegionPopover] = useState<string | null>(null);
  const [regionStyles, setRegionStyles] =
    useState<Record<string, RegionStyleState>>(buildInitialRegionStyles);
  const [labelStyles, setLabelStyles] =
    useState<LabelStylesRecord>(buildInitialLabelStyles);
  const mixedFacilityColors = getMixedRegionColors(regionStyles, 'color');
  const mixedFacilityBorderColors = getMixedRegionColors(
    regionStyles,
    'borderColor',
  );

  const applyFacilityStyle = <K extends RegionStyleKey>(
    key: K,
    value: RegionStyleState[K],
  ) => {
    setRegionStyles((current) =>
      applyGlobalStyleChange(current, {
        [key]: value,
      } as Partial<RegionStyleState>),
    );
  };

  const setFacilityStyle = <K extends RegionStyleKey>(
    key: K,
    value: RegionStyleState[K],
  ) => {
    switch (key) {
      case 'shape':
        setFacilityShape(value as PrototypeShape);
        break;
      case 'size':
        setFacilitySymbolSize(value as number);
        break;
      case 'opacity':
        setFacilityOpacity(value as number);
        break;
      case 'color':
        setFacilityColor(value as string);
        break;
      case 'borderColor':
        setFacilityBorderColor(value as string);
        break;
      case 'borderWidth':
        setFacilityBorderWidth(value as number);
        break;
      case 'borderOpacity':
        setFacilityBorderOpacity(value as number);
        break;
    }

    applyFacilityStyle(key, value);
  };

  const setLabelStyle = <K extends LabelStyleKey>(
    sectionId: LabelSectionId,
    key: K,
    value: LabelStyleState[K],
  ) => {
    setLabelStyles((current) => ({
      ...current,
      [sectionId]: {
        ...current[sectionId],
        [key]: value,
      },
    }));
  };

  const resetPrototypeState = () => {
    setOpenPanes(DEFAULT_OPEN_PANES);
    setOpenBasemapSections(DEFAULT_BASEMAP_SECTIONS);
    setOpenFacilitySections(DEFAULT_FACILITY_SECTIONS);
    setOpenLabelSections(DEFAULT_LABEL_SECTIONS);
    setOpenOverlaySections(DEFAULT_OVERLAY_SECTIONS);
    setActivePreset('current');
    setLandOpacity(0.84);
    setSeaOpacity(0.78);
    setFacilityShape(INITIAL_FACILITY_STYLE.shape);
    setFacilitySymbolSize(INITIAL_FACILITY_STYLE.size);
    setFacilityColor(INITIAL_FACILITY_STYLE.color);
    setFacilityOpacity(INITIAL_FACILITY_STYLE.opacity);
    setFacilityBorderColor(INITIAL_FACILITY_STYLE.borderColor);
    setFacilityBorderWidth(INITIAL_FACILITY_STYLE.borderWidth);
    setFacilityBorderOpacity(INITIAL_FACILITY_STYLE.borderOpacity);
    setPaneEnabled(INITIAL_PANE_ENABLED);
    setSectionEnabled(INITIAL_SECTION_ENABLED);
    setRegionEnabled(buildInitialRegionEnabled);
    setOverlayRowEnabled(INITIAL_OVERLAY_ROW_ENABLED);
    setOpenRegionPopover(null);
    setRegionStyles(buildInitialRegionStyles);
    setLabelStyles(buildInitialLabelStyles);
  };

  return (
    <div className="app-shell prototype-app-shell">
      <PrototypeTopBar onReset={resetPrototypeState} />
      <div ref={setWorkspaceGridElement} className="workspace-grid">
        <PrototypeMapPlaceholder />

        <aside
          ref={setSidebarElement}
          className="sidebar sidebar--right"
          aria-label="Right sidebar prototype"
        >
          <PrototypeAccordion
            value={openPanes}
            onValueChange={setOpenPanes}
            level="pane"
          >
            <PrototypePanel
              id="basemap"
              title="Basemap"
              enabled={paneEnabled.basemap}
              onEnabledToggle={() => toggleKey('basemap', setPaneEnabled)}
            >
              <PrototypeAccordion
                value={openBasemapSections}
                onValueChange={setOpenBasemapSections}
                level="subpane"
              >
                {BASEMAP_SIMPLE_SECTIONS.map((section) => (
                  <PrototypeSimpleSection
                    key={section.id}
                    section={section}
                    enabled={sectionEnabled[section.id]}
                    onEnabledToggle={() =>
                      toggleKey(section.id, setSectionEnabled)
                    }
                    opacityValue={
                      section.id === 'land' ? landOpacity : seaOpacity
                    }
                    onOpacityChange={
                      section.id === 'land' ? setLandOpacity : setSeaOpacity
                    }
                  />
                ))}
              </PrototypeAccordion>
            </PrototypePanel>

            <PrototypePresetRow
              activePreset={activePreset}
              onPresetChange={setActivePreset}
            />

            <PrototypePanel
              id="facilities"
              title="Facilities"
              enabled={paneEnabled.facilities}
              onEnabledToggle={() => toggleKey('facilities', setPaneEnabled)}
            >
              <PrototypeAccordion
                value={openFacilitySections}
                onValueChange={setOpenFacilitySections}
                level="subpane"
              >
                <PrototypeSection
                  id="pmc"
                  title="PMC"
                  enabled={sectionEnabled.pmc}
                  onEnabledToggle={() => toggleKey('pmc', setSectionEnabled)}
                  badge={`${Math.round(facilityOpacity * 100)}%`}
                  badgeSwatch={facilityColor}
                  badgeSwatchOpacity={facilityOpacity}
                  badgeSwatchMix={mixedFacilityColors}
                >
                  <PrototypeControlField label="Shape">
                    <PrototypeShapePicker
                      value={facilityShape}
                      onChange={(shape) => setFacilityStyle('shape', shape)}
                    />
                  </PrototypeControlField>

                  <PrototypeSliderControl
                    id="pmc-size"
                    label="Size"
                    value={facilitySymbolSize}
                    min={1}
                    max={12}
                    step={0.5}
                    mode="raw"
                    onChange={(size) => setFacilityStyle('size', size)}
                  />

                  <PrototypeColorField
                    id="pmc-colour"
                    label="Colour"
                    value={facilityColor}
                    opacityPreview={facilityOpacity}
                    mixedSwatches={mixedFacilityColors}
                    onChange={(color) => setFacilityStyle('color', color)}
                  />

                  <PrototypeSliderControl
                    id="pmc-opacity"
                    label="Opacity"
                    value={facilityOpacity}
                    onChange={(opacity) => setFacilityStyle('opacity', opacity)}
                  />

                  <PrototypeColorField
                    id="pmc-border-colour"
                    label="Border colour"
                    value={facilityBorderColor}
                    opacityPreview={facilityBorderOpacity}
                    mixedSwatches={mixedFacilityBorderColors}
                    onChange={(borderColor) =>
                      setFacilityStyle('borderColor', borderColor)
                    }
                  />

                  <PrototypeSliderControl
                    id="pmc-border-width"
                    label="Line thickness"
                    value={facilityBorderWidth}
                    min={0}
                    max={6}
                    step={0.5}
                    mode="raw"
                    onChange={(borderWidth) =>
                      setFacilityStyle('borderWidth', borderWidth)
                    }
                  />

                  <PrototypeSliderControl
                    id="pmc-border-opacity"
                    label="Border opacity"
                    value={facilityBorderOpacity}
                    onChange={(borderOpacity) =>
                      setFacilityStyle('borderOpacity', borderOpacity)
                    }
                  />

                  <div className="stack-col prototype-region-list">
                    {REGION_ROWS.map((region) => (
                      <PrototypeRegionRow
                        key={region}
                        label={region}
                        enabled={regionEnabled[region]}
                        onToggle={() => toggleKey(region, setRegionEnabled)}
                        styleState={regionStyles[region]}
                        popoverOpen={openRegionPopover === region}
                        onPopoverOpenChange={(open) =>
                          setOpenRegionPopover(open ? region : null)
                        }
                        scrollContainer={sidebarElement}
                        portalContainer={workspaceGridElement}
                        onStyleChange={(nextStyle) =>
                          setRegionStyles((current) => ({
                            ...current,
                            [region]: nextStyle,
                          }))
                        }
                      />
                    ))}
                  </div>
                </PrototypeSection>
              </PrototypeAccordion>

              <input
                className="input input--compact"
                type="text"
                placeholder="Search facilities..."
                aria-label="Search facilities"
              />
            </PrototypePanel>

            <PrototypePanel
              id="labels"
              title="Labels"
              enabled={paneEnabled.labels}
              onEnabledToggle={() => toggleKey('labels', setPaneEnabled)}
            >
              <PrototypeAccordion
                value={openLabelSections}
                onValueChange={setOpenLabelSections}
                level="subpane"
              >
                {LABEL_SIMPLE_SECTIONS.map((section) => (
                  <PrototypeLabelSection
                    key={section.id}
                    section={section}
                    enabled={sectionEnabled[section.id]}
                    onEnabledToggle={() =>
                      toggleKey(section.id, setSectionEnabled)
                    }
                    styleState={labelStyles[section.id]}
                    onStyleChange={(key, value) =>
                      setLabelStyle(section.id, key, value)
                    }
                  />
                ))}
              </PrototypeAccordion>
            </PrototypePanel>

            <PrototypePanel
              id="overlays"
              title="Overlays"
              enabled={paneEnabled.overlays}
              onEnabledToggle={() => toggleKey('overlays', setPaneEnabled)}
            >
              <PrototypeAccordion
                value={openOverlaySections}
                onValueChange={setOpenOverlaySections}
                level="subpane"
              >
                <PrototypeSection
                  id="board-boundaries"
                  title="Board boundaries"
                  enabled={sectionEnabled['board-boundaries']}
                  onEnabledToggle={() =>
                    toggleKey('board-boundaries', setSectionEnabled)
                  }
                  badge="3 layers"
                >
                  {OVERLAY_ROWS.map((row) => (
                    <PrototypeStaticRow
                      key={row.key}
                      label={row.label}
                      enabled={overlayRowEnabled[row.key]}
                      onToggle={() => toggleKey(row.key, setOverlayRowEnabled)}
                      value={row.value}
                      swatch={row.swatch}
                    />
                  ))}
                </PrototypeSection>
              </PrototypeAccordion>
            </PrototypePanel>
          </PrototypeAccordion>
        </aside>
      </div>
    </div>
  );
}

interface PrototypeTopBarProps {
  onReset: () => void;
}

interface PrototypePanelProps {
  id: string;
  title: string;
  enabled: boolean;
  onEnabledToggle: () => void;
  children: React.ReactNode;
}

interface PrototypeSectionProps extends PrototypePanelProps {
  badge?: string;
  badgeSwatch?: string;
  badgeSwatchOpacity?: number;
  badgeSwatchMix?: SwatchStop[];
}

interface PrototypeColourOpacityFieldsProps {
  colourId: string;
  colourValue: string;
  colourOpacity?: number;
  colourMix?: SwatchStop[];
  opacityId: string;
  opacityValue: number;
  onOpacityChange: (value: number) => void;
}

interface PrototypeSimpleSectionConfig {
  id: string;
  title: string;
  colourId: string;
  colourValue: string;
  opacityId: string;
}

interface PrototypeLabelSectionProps {
  section: PrototypeSimpleSectionConfig;
  enabled: boolean;
  onEnabledToggle: () => void;
  styleState: LabelStyleState;
  onStyleChange: <K extends LabelStyleKey>(
    key: K,
    value: LabelStyleState[K],
  ) => void;
}

interface PrototypeSimpleSectionProps {
  section: PrototypeSimpleSectionConfig;
  enabled: boolean;
  onEnabledToggle: () => void;
  opacityValue: number;
  onOpacityChange: (value: number) => void;
}

interface PrototypePresetRowProps {
  activePreset: string;
  onPresetChange: (preset: string) => void;
}

interface PrototypeRegionRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  styleState: RegionStyleState;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onStyleChange: (nextStyle: RegionStyleState) => void;
  scrollContainer: HTMLElement | null;
  portalContainer: HTMLDivElement | null;
}

function PrototypeMapPlaceholder() {
  return (
    <section className="prototype-map-void" aria-label="Map omitted">
      <div className="prototype-map-void__card">
        <div className="prototype-map-void__eyebrow">Layout prototype</div>
        <h1 className="prototype-map-void__title">Production shell, map removed</h1>
        <p className="prototype-map-void__body">
          This page uses the same top bar, sidebar width, panel order, spacing,
          and general visual language as the live app, but replaces the
          OpenLayers workspace with a static placeholder so the pane structure
          can be reviewed in isolation.
        </p>
      </div>
    </section>
  );
}

function PrototypeTopBar({ onReset }: PrototypeTopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__title">dmsGIS</div>
        <div className="topbar__subtitle">Prototype shell with local-only actions</div>
      </div>
      <div className="topbar__actions">
        <button type="button" className="button button--ghost">
          Open
        </button>
        <button type="button" className="button button--ghost">
          Save
        </button>
        <button type="button" className="button button--ghost">
          Export
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </header>
  );
}

function PrototypePresetRow({
  activePreset,
  onPresetChange,
}: PrototypePresetRowProps) {
  return (
    <div className="sidebar-action-row" aria-label="Map presets">
      {VIEW_PRESET_BUTTONS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`button sidebar-action-row__button${
            activePreset === preset.id ? ' sidebar-action-row__button--active' : ''
          }`}
          onClick={() => onPresetChange(preset.id)}
          aria-pressed={activePreset === preset.id}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

function PrototypePanel({
  id,
  title,
  enabled,
  onEnabledToggle,
  children,
}: PrototypePanelProps) {
  return (
    <PrototypeAccordionItem
      id={id}
      title={title}
      level="pane"
      panel
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
    >
      <div className="prototype-panel__content">{children}</div>
    </PrototypeAccordionItem>
  );
}

function PrototypeSection({
  id,
  title,
  badge,
  badgeSwatch,
  badgeSwatchOpacity,
  badgeSwatchMix,
  enabled,
  onEnabledToggle,
  children,
}: PrototypeSectionProps) {
  return (
    <PrototypeAccordionItem
      id={id}
      title={title}
      badge={badge}
      badgeSwatch={badgeSwatch}
      badgeSwatchOpacity={badgeSwatchOpacity}
      badgeSwatchMix={badgeSwatchMix}
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
      level="subpane"
    >
      <div className="prototype-section__content">{children}</div>
    </PrototypeAccordionItem>
  );
}

function PrototypeColourOpacityFields({
  colourId,
  colourValue,
  colourOpacity,
  colourMix,
  opacityId,
  opacityValue,
  onOpacityChange,
}: PrototypeColourOpacityFieldsProps) {
  return (
    <>
      <PrototypeColorField
        id={colourId}
        label="Colour"
        value={colourValue}
        opacityPreview={colourOpacity}
        mixedSwatches={colourMix}
      />
      <PrototypeSliderControl
        id={opacityId}
        label="Opacity"
        value={opacityValue}
        onChange={onOpacityChange}
      />
    </>
  );
}

function PrototypeSimpleSection({
  section,
  enabled,
  onEnabledToggle,
  opacityValue,
  onOpacityChange,
}: PrototypeSimpleSectionProps) {
  return (
    <PrototypeSection
      id={section.id}
      title={section.title}
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
      badge={`${Math.round(opacityValue * 100)}%`}
      badgeSwatch={section.colourValue}
      badgeSwatchOpacity={opacityValue}
    >
      <PrototypeColourOpacityFields
        colourId={section.colourId}
        colourValue={section.colourValue}
        colourOpacity={opacityValue}
        opacityId={section.opacityId}
        opacityValue={opacityValue}
        onOpacityChange={onOpacityChange}
      />
    </PrototypeSection>
  );
}

function PrototypeLabelSection({
  section,
  enabled,
  onEnabledToggle,
  styleState,
  onStyleChange,
}: PrototypeLabelSectionProps) {
  return (
    <PrototypeSection
      id={section.id}
      title={section.title}
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
      badge={`${Math.round(styleState.opacity * 100)}%`}
      badgeSwatch={styleState.color}
      badgeSwatchOpacity={styleState.opacity}
    >
      <PrototypeControlSection title="Text">
        <PrototypeColorField
          id={section.colourId}
          label="Colour"
          value={styleState.color}
          opacityPreview={styleState.opacity}
          onChange={(color) => onStyleChange('color', color)}
        />

        <PrototypeSliderControl
          id={`${section.id}-size`}
          label="Size"
          value={styleState.size}
          min={1}
          max={18}
          step={0.5}
          mode="raw"
          onChange={(size) => onStyleChange('size', size)}
        />

        <PrototypeSliderControl
          id={section.opacityId}
          label="Opacity"
          value={styleState.opacity}
          onChange={(opacity) => onStyleChange('opacity', opacity)}
        />
      </PrototypeControlSection>

      <div className="prototype-popover__divider" aria-hidden="true" />

      <PrototypeControlSection title="Border">
        <PrototypeColorField
          id={`${section.id}-border-colour`}
          label="Colour"
          value={styleState.borderColor}
          opacityPreview={styleState.borderOpacity}
          onChange={(borderColor) => onStyleChange('borderColor', borderColor)}
        />

        <PrototypeSliderControl
          id={`${section.id}-border-width`}
          label="Thickness"
          value={styleState.borderWidth}
          min={0}
          max={6}
          step={0.5}
          mode="raw"
          onChange={(borderWidth) => onStyleChange('borderWidth', borderWidth)}
        />

        <PrototypeSliderControl
          id={`${section.id}-border-opacity`}
          label="Opacity"
          value={styleState.borderOpacity}
          onChange={(borderOpacity) =>
            onStyleChange('borderOpacity', borderOpacity)
          }
        />
      </PrototypeControlSection>
    </PrototypeSection>
  );
}

function PrototypeRegionRow({
  label,
  enabled,
  onToggle,
  styleState,
  popoverOpen,
  onPopoverOpenChange,
  onStyleChange,
  scrollContainer,
  portalContainer,
}: PrototypeRegionRowProps) {
  const opacityValue = `${Math.round(styleState.opacity * 100)}%`;

  return (
    <div className="prototype-region-row">
      <span className="color-control__label color-control__label--region">
        {label}
      </span>
      <span className="prototype-accordion-item__meta">
        <PrototypeToggleButton enabled={enabled} onClick={onToggle} />
        <PrototypePopover
          open={popoverOpen}
          onOpenChange={onPopoverOpenChange}
          scrollContainer={scrollContainer}
          portalContainer={portalContainer}
          viewportContainer={scrollContainer}
          trigger={
            <PrototypeMetricPill
              value={opacityValue}
              swatch={styleState.color}
              swatchOpacity={styleState.opacity}
              swatchShape={styleState.shape}
              swatchBorderColor={styleState.borderColor}
              swatchBorderWidth={styleState.borderWidth}
              swatchBorderOpacity={styleState.borderOpacity}
              asButton
              ariaExpanded={popoverOpen}
              ariaHaspopup="dialog"
            />
          }
        >
          <div className="prototype-popover__content">
            <PrototypeControlSection title="Points">
              <PrototypeControlField label="Shape">
                <PrototypeShapePicker
                  value={styleState.shape}
                  onChange={(shape) =>
                    onStyleChange({
                      ...styleState,
                      shape,
                    })
                  }
                />
              </PrototypeControlField>

              <PrototypeSliderControl
                id={`${label}-size`}
                label="Size"
                value={styleState.size}
                min={1}
                max={12}
                step={0.5}
                mode="raw"
                onChange={(size) =>
                  onStyleChange({
                    ...styleState,
                    size,
                  })
                }
              />

              <PrototypeColorField
                id={`${label}-colour`}
                label="Colour"
                value={styleState.color}
                opacityPreview={styleState.opacity}
                onChange={(color) =>
                  onStyleChange({
                    ...styleState,
                    color,
                  })
                }
              />

              <PrototypeSliderControl
                id={`${label}-opacity`}
                label="Opacity"
                value={styleState.opacity}
                onChange={(opacity) =>
                  onStyleChange({
                    ...styleState,
                    opacity,
                  })
                }
              />
            </PrototypeControlSection>

            <div className="prototype-popover__divider" aria-hidden="true" />
            <PrototypeControlSection title="Border">
              <PrototypeColorField
                id={`${label}-border-colour`}
                label="Colour"
                value={styleState.borderColor}
                opacityPreview={styleState.borderOpacity}
                onChange={(borderColor) =>
                  onStyleChange({
                    ...styleState,
                    borderColor,
                  })
                }
              />

              <PrototypeSliderControl
                id={`${label}-border-width`}
                label="Thickness"
                value={styleState.borderWidth}
                min={0}
                max={6}
                step={0.5}
                mode="raw"
                onChange={(borderWidth) =>
                  onStyleChange({
                    ...styleState,
                    borderWidth,
                  })
                }
              />

              <PrototypeSliderControl
                id={`${label}-border-opacity`}
                label="Opacity"
                value={styleState.borderOpacity}
                onChange={(borderOpacity) =>
                  onStyleChange({
                    ...styleState,
                    borderOpacity,
                  })
                }
              />
            </PrototypeControlSection>
          </div>
        </PrototypePopover>
      </span>
    </div>
  );
}

function applyGlobalStyleChange(
  current: Record<string, RegionStyleState>,
  overrides: Partial<RegionStyleState>,
) {
  return Object.fromEntries(
    Object.entries(current).map(([region, style]) => [
      region,
      {
        ...style,
        ...overrides,
      },
    ]),
  ) as Record<string, RegionStyleState>;
}

function toggleKey(
  key: string,
  setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
) {
  setState((current) => ({
    ...current,
    [key]: !current[key],
  }));
}
