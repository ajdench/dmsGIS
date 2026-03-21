import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type Modifier,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VIEW_PRESET_BUTTONS } from '../../lib/config/viewPresets';
import {
  PrototypeAccordion,
  PrototypeAccordionItem,
  PrototypeChevronDownIcon,
} from './PrototypeAccordion';
import {
  BASEMAP_SIMPLE_SECTIONS,
  buildInitialRegionEnabled,
  DEFAULT_OPEN_PANES,
  INITIAL_OVERLAY_ROW_ENABLED,
  INITIAL_PANE_ENABLED,
  INITIAL_SECTION_ENABLED,
  LABEL_SIMPLE_SECTIONS,
  OVERLAY_ROWS,
  REGION_ROWS,
} from './data';
import {
  PrototypeDragHandle,
  PrototypeInlineRowShell,
  PrototypePillPopover,
  PrototypeSectionCardShell,
  type PrototypeShape,
  type SwatchStop,
} from './PrototypeControls';
import {
  buildBasemapControlSections,
  buildFacilityControlSections,
  buildLabelControlSections,
  buildOverlayControlSections,
  buildRegionControlSections,
  renderPrototypeControlSections,
} from './popoverFields';
import {
  applyGlobalStyleChange,
  buildInitialLabelStyles,
  buildInitialOverlayStyles,
  buildInitialRegionStyles,
  getMixedRegionColors,
  INITIAL_FACILITY_STYLE,
  type LabelSectionId,
  type LabelStyleKey,
  type LabelStyleState,
  type LabelStylesRecord,
  type OverlaySectionId,
  type OverlayStyleKey,
  type OverlayStyleState,
  type OverlayStylesRecord,
  type RegionStyleKey,
  type RegionStyleState,
  updateStyleRecord,
} from './prototypeStyleState';
import { reorderItems } from './sortableList';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

type PrototypePresetButtonSizeMode = 'current' | 'midLow' | 'mid' | 'row';

const PROTOTYPE_TOPBAR_BUTTON_SIZE_MODE: PrototypePresetButtonSizeMode = 'current';
const PROTOTYPE_PRESET_BUTTON_SIZE_MODE: PrototypePresetButtonSizeMode = 'midLow';

export function SidebarPrototypeApp() {
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [openPanes, setOpenPanes] = useState<string[]>(DEFAULT_OPEN_PANES);
  const [activePreset, setActivePreset] = useState('current');
  const [basemapSectionOrder, setBasemapSectionOrder] = useState<string[]>(
    BASEMAP_SIMPLE_SECTIONS.map((section) => section.id),
  );
  const [labelSectionOrder, setLabelSectionOrder] = useState<string[]>(
    LABEL_SIMPLE_SECTIONS.map((section) => section.id),
  );
  const [overlaySectionOrder, setOverlaySectionOrder] = useState<OverlaySectionId[]>(
    OVERLAY_ROWS.map((row) => row.key),
  );
  const [paneOrder, setPaneOrder] = useState([
    'basemap',
    'facilities',
    'labels',
    'overlays',
  ]);
  const [landColor, setLandColor] = useState('#f4f7ef');
  const [landOpacity, setLandOpacity] = useState(0.84);
  const [seaColor, setSeaColor] = useState('#e7f0fd');
  const [seaOpacity, setSeaOpacity] = useState(0.78);
  const [facilityPointsEnabled, setFacilityPointsEnabled] = useState(
    INITIAL_FACILITY_STYLE.pointsEnabled,
  );
  const [facilityBorderEnabled, setFacilityBorderEnabled] = useState(
    INITIAL_FACILITY_STYLE.borderEnabled,
  );
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
  const [regionOrder, setRegionOrder] = useState<string[]>([...REGION_ROWS]);
  const [overlayRowEnabled, setOverlayRowEnabled] =
    useState<Record<string, boolean>>(INITIAL_OVERLAY_ROW_ENABLED);
  const [openRegionPopover, setOpenRegionPopover] = useState<string | null>(null);
  const [regionStyles, setRegionStyles] =
    useState<Record<string, RegionStyleState>>(buildInitialRegionStyles);
  const [labelStyles, setLabelStyles] =
    useState<LabelStylesRecord>(buildInitialLabelStyles);
  const [overlayStyles, setOverlayStyles] =
    useState<OverlayStylesRecord>(buildInitialOverlayStyles);
  const mixedFacilityColors = getMixedRegionColors(regionStyles, 'color');
  const mixedFacilityBorderColors = getMixedRegionColors(
    regionStyles,
    'borderColor',
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      case 'pointsEnabled':
        setFacilityPointsEnabled(value as boolean);
        break;
      case 'borderEnabled':
        setFacilityBorderEnabled(value as boolean);
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
    setLabelStyles((current) => updateStyleRecord(current, sectionId, key, value));
  };

  const setOverlayStyle = <K extends OverlayStyleKey>(
    sectionId: OverlaySectionId,
    key: K,
    value: OverlayStyleState[K],
  ) => {
    setOverlayStyles((current) => updateStyleRecord(current, sectionId, key, value));
  };

  const resetPrototypeState = () => {
    setOpenPanes(DEFAULT_OPEN_PANES);
    setActivePreset('current');
    setPaneOrder(['basemap', 'facilities', 'labels', 'overlays']);
    setBasemapSectionOrder(BASEMAP_SIMPLE_SECTIONS.map((section) => section.id));
    setLabelSectionOrder(LABEL_SIMPLE_SECTIONS.map((section) => section.id));
    setOverlaySectionOrder(OVERLAY_ROWS.map((row) => row.key));
    setLandColor('#f4f7ef');
    setLandOpacity(0.84);
    setSeaColor('#e7f0fd');
    setSeaOpacity(0.78);
    setFacilityPointsEnabled(INITIAL_FACILITY_STYLE.pointsEnabled);
    setFacilityBorderEnabled(INITIAL_FACILITY_STYLE.borderEnabled);
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
    setRegionOrder([...REGION_ROWS]);
    setOverlayRowEnabled(INITIAL_OVERLAY_ROW_ENABLED);
    setOpenRegionPopover(null);
    setRegionStyles(buildInitialRegionStyles);
    setLabelStyles(buildInitialLabelStyles);
    setOverlayStyles(buildInitialOverlayStyles);
  };

  const handleRegionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setRegionOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  const handleSectionDragEnd =
    <T extends string>(setOrder: React.Dispatch<React.SetStateAction<T[]>>) =>
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return;
      }

      setOrder((current) =>
        reorderItems(current, String(active.id) as T, String(over.id) as T),
      );
    };

  return (
    <div
      className={`app-shell prototype-app-shell prototype-app-shell--topbar-buttons-${PROTOTYPE_TOPBAR_BUTTON_SIZE_MODE} prototype-app-shell--preset-buttons-${PROTOTYPE_PRESET_BUTTON_SIZE_MODE}`}
    >
      <PrototypeTopBar onReset={resetPrototypeState} />
      <div ref={setWorkspaceGridElement} className="workspace-grid">
        <PrototypeMapPlaceholder />

        <aside
          ref={setSidebarElement}
          className="sidebar sidebar--right"
          aria-label="Right sidebar prototype"
        >
          <div className="prototype-sidebar-presets">
            <PrototypePresetRow
              activePreset={activePreset}
              onPresetChange={setActivePreset}
            />

            <button
              type="button"
              className={`button sidebar-action-row__button sidebar-action-row__button--full${
                activePreset === 'dphc-playground'
                  ? ' sidebar-action-row__button--active'
                  : ''
              }`}
              onClick={() => setActivePreset('dphc-playground')}
              aria-pressed={activePreset === 'dphc-playground'}
            >
              <span className="sidebar-action-row__button-label">
                <span>DPHC Estimate COA</span>
                <em>Playground</em>
              </span>
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleSectionDragEnd(setPaneOrder)}
          >
            <SortableContext items={paneOrder} strategy={verticalListSortingStrategy}>
              <PrototypeAccordion
                value={openPanes}
                onValueChange={setOpenPanes}
                level="pane"
              >
            <PrototypeSortablePanel
              id="basemap"
              title="Basemap"
              enabled={paneEnabled.basemap}
              onEnabledToggle={() => toggleKey('basemap', setPaneEnabled)}
              sortOrder={paneOrder.indexOf('basemap')}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleSectionDragEnd(setBasemapSectionOrder)}
              >
                <SortableContext
                  items={basemapSectionOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="prototype-section-list">
                    {basemapSectionOrder.map((sectionId) => {
                      const section = BASEMAP_SIMPLE_SECTIONS.find(
                        (candidate) => candidate.id === sectionId,
                      );

                      if (!section) {
                        return null;
                      }

                      return (
                        <PrototypeSortablePopoverSection
                          key={section.id}
                          id={section.id}
                          title={section.title}
                          enabled={sectionEnabled[section.id]}
                          onEnabledToggle={() =>
                            toggleKey(section.id, setSectionEnabled)
                          }
                          badge={`${
                            Math.round(
                              (section.id === 'land' ? landOpacity : seaOpacity) * 100,
                            )
                          }%`}
                          badgeSwatch={section.id === 'land' ? landColor : seaColor}
                          badgeSwatchBorderWidth={0}
                          badgeSwatchOpacity={
                            section.id === 'land' ? landOpacity : seaOpacity
                          }
                          scrollContainer={sidebarElement}
                          portalContainer={workspaceGridElement}
                          triangleMinRatio={0.15}
                          triangleMaxRatio={0.85}
                          popoverContent={renderPrototypeControlSections(
                            buildBasemapControlSections({
                              idPrefix: section.id,
                              enabled: sectionEnabled[section.id],
                              onToggle: () =>
                                toggleKey(section.id, setSectionEnabled),
                              colourValue:
                                section.id === 'land' ? landColor : seaColor,
                              colourOpacity:
                                section.id === 'land' ? landOpacity : seaOpacity,
                              onColorChange:
                                section.id === 'land' ? setLandColor : setSeaColor,
                              onOpacityChange:
                                section.id === 'land'
                                  ? setLandOpacity
                                  : setSeaOpacity,
                            }),
                          )}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </PrototypeSortablePanel>

            <PrototypeSortablePanel
              id="facilities"
              title="Facilities"
              enabled={paneEnabled.facilities}
              onEnabledToggle={() => toggleKey('facilities', setPaneEnabled)}
              sortOrder={paneOrder.indexOf('facilities')}
            >
              <div className="prototype-section-list">
                <PrototypeCollapsiblePopoverSection
                  id="pmc"
                  title="PMC"
                  enabled={sectionEnabled.pmc}
                  onEnabledToggle={() => toggleKey('pmc', setSectionEnabled)}
                  badge={`${Math.round(facilityOpacity * 100)}%`}
                  badgeSwatch={facilityColor}
                  badgeSwatchShape={facilityShape}
                  badgeSwatchOpacity={facilityPointsEnabled ? facilityOpacity : 0}
                  badgeSwatchMix={
                    facilityPointsEnabled ? mixedFacilityColors : undefined
                  }
                  badgeSwatchBorderColor={facilityBorderColor}
                  badgeSwatchBorderWidth={
                    facilityBorderEnabled ? facilityBorderWidth : 0
                  }
                  badgeSwatchBorderOpacity={
                    facilityBorderEnabled ? facilityBorderOpacity : 0
                  }
                  scrollContainer={sidebarElement}
                  portalContainer={workspaceGridElement}
                  popoverContent={renderPrototypeControlSections(
                    buildFacilityControlSections({
                      facilityPointsEnabled,
                      facilityBorderEnabled,
                      facilityShape,
                      facilitySymbolSize,
                      facilityColor,
                      facilityOpacity,
                      mixedFacilityColors,
                      facilityBorderColor,
                      facilityBorderWidth,
                      facilityBorderOpacity,
                      mixedFacilityBorderColors,
                      setFacilityStyle,
                    }),
                  )}
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleRegionDragEnd}
                  >
                    <SortableContext
                      items={regionOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="stack-col prototype-region-list">
                        {regionOrder.map((region) => (
                          <PrototypeSortableRegionRow
                            key={region}
                            id={region}
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
                    </SortableContext>
                  </DndContext>
                </PrototypeCollapsiblePopoverSection>
              </div>

              <input
                className="input input--compact"
                type="text"
                placeholder="Search facilities..."
                aria-label="Search facilities"
              />
            </PrototypeSortablePanel>

            <PrototypeSortablePanel
              id="labels"
              title="Labels"
              enabled={paneEnabled.labels}
              onEnabledToggle={() => toggleKey('labels', setPaneEnabled)}
              sortOrder={paneOrder.indexOf('labels')}
            >
              <div className="prototype-section-list">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleSectionDragEnd(setLabelSectionOrder)}
                >
                  <SortableContext
                    items={labelSectionOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    {labelSectionOrder.map((sectionId) => {
                      const section = LABEL_SIMPLE_SECTIONS.find(
                        (candidate) => candidate.id === sectionId,
                      );

                      if (!section) {
                        return null;
                      }

                      return (
                        <PrototypeSortablePopoverSection
                          key={section.id}
                          id={section.id}
                          title={section.title}
                          enabled={sectionEnabled[section.id]}
                          onEnabledToggle={() =>
                            toggleKey(section.id, setSectionEnabled)
                          }
                          badge={`${Math.round(labelStyles[section.id].opacity * 100)}%`}
                          badgeSwatch={labelStyles[section.id].color}
                          badgeSwatchOpacity={
                            labelStyles[section.id].textEnabled
                              ? labelStyles[section.id].opacity
                              : 0
                          }
                          badgeSwatchBorderColor={labelStyles[section.id].borderColor}
                          badgeSwatchBorderWidth={
                            labelStyles[section.id].borderEnabled
                              ? labelStyles[section.id].borderWidth
                              : 0
                          }
                          badgeSwatchBorderOpacity={
                            labelStyles[section.id].borderEnabled
                              ? labelStyles[section.id].borderOpacity
                              : 0
                          }
                          scrollContainer={sidebarElement}
                          portalContainer={workspaceGridElement}
                          popoverContent={renderPrototypeControlSections(
                            buildLabelControlSections(
                              section,
                              labelStyles[section.id],
                              setLabelStyle,
                            ),
                          )}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </PrototypeSortablePanel>

            <PrototypeSortablePanel
              id="overlays"
              title="Overlays"
              enabled={paneEnabled.overlays}
              onEnabledToggle={() => toggleKey('overlays', setPaneEnabled)}
              sortOrder={paneOrder.indexOf('overlays')}
            >
              <div className="prototype-section-list">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleSectionDragEnd(setOverlaySectionOrder)}
                >
                  <SortableContext
                    items={overlaySectionOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    {overlaySectionOrder.map((sectionId) => {
                      const row = OVERLAY_ROWS.find(
                        (candidate) => candidate.key === sectionId,
                      );

                      if (!row) {
                        return null;
                      }

                      return (
                        <PrototypeSortablePopoverSection
                          key={sectionId}
                          id={sectionId}
                          title={row.label}
                          enabled={overlayRowEnabled[sectionId]}
                          onEnabledToggle={() =>
                            toggleKey(sectionId, setOverlayRowEnabled)
                          }
                          badge={`${Math.round(overlayStyles[sectionId].opacity * 100)}%`}
                          badgeSwatch={overlayStyles[sectionId].color}
                          badgeSwatchOpacity={
                            overlayStyles[sectionId].layerEnabled
                              ? overlayStyles[sectionId].opacity
                              : 0
                          }
                          badgeSwatchBorderColor={overlayStyles[sectionId].borderColor}
                          badgeSwatchBorderWidth={
                            overlayStyles[sectionId].borderEnabled
                              ? overlayStyles[sectionId].borderWidth
                              : 0
                          }
                          badgeSwatchBorderOpacity={
                            overlayStyles[sectionId].borderEnabled
                              ? overlayStyles[sectionId].borderOpacity
                              : 0
                          }
                          scrollContainer={sidebarElement}
                          portalContainer={workspaceGridElement}
                          popoverContent={renderPrototypeControlSections(
                            buildOverlayControlSections(
                              sectionId,
                              overlayStyles[sectionId],
                              setOverlayStyle,
                            ),
                          )}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </PrototypeSortablePanel>
              </PrototypeAccordion>
            </SortableContext>
          </DndContext>
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
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (element: HTMLButtonElement | null) => void;
  sortOrder?: number;
}

interface PrototypeSectionProps {
  id?: string;
  title: string;
  enabled: boolean;
  onEnabledToggle: () => void;
  badge?: string;
  badgeSwatch?: string;
  badgeSwatchShape?: PrototypeShape;
  badgeSwatchOpacity?: number;
  badgeSwatchMix?: SwatchStop[];
  badgeSwatchBorderColor?: string;
  badgeSwatchBorderWidth?: number;
  badgeSwatchBorderOpacity?: number;
  debugCircleOverlay?: boolean;
  children?: React.ReactNode;
}

interface PrototypeSimpleSectionConfig {
  id: string;
  title: string;
  colourId: string;
  colourValue: string;
  opacityId: string;
}

interface PrototypePopoverSectionProps extends PrototypeSectionProps {
  popoverContent: React.ReactNode;
  scrollContainer: HTMLElement | null;
  portalContainer: HTMLDivElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (element: HTMLButtonElement | null) => void;
  sortableStyle?: React.CSSProperties;
  isDragging?: boolean;
}

interface PrototypeCollapsiblePopoverSectionProps
  extends PrototypePopoverSectionProps {
  defaultExpanded?: boolean;
}

interface PrototypeSortablePopoverSectionProps extends PrototypePopoverSectionProps {
  id: string;
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
  sortableStyle?: React.CSSProperties;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (element: HTMLButtonElement | null) => void;
  isDragging?: boolean;
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
  dragHandleProps,
  dragHandleRef,
  sortOrder,
}: PrototypePanelProps) {
  return (
    <div style={sortOrder !== undefined ? { order: sortOrder } : undefined}>
      <PrototypeAccordionItem
        id={id}
        title={title}
        level="pane"
        panel
        enabled={enabled}
        onEnabledToggle={onEnabledToggle}
        dragHandleProps={dragHandleProps}
        dragHandleRef={dragHandleRef}
      >
        <div className="prototype-panel__content">{children}</div>
      </PrototypeAccordionItem>
    </div>
  );
}

function PrototypeSortablePanel({ id, ...props }: PrototypePanelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <PrototypePanel
        id={id}
        {...props}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
}

function PrototypePopoverSection({
  title,
  badge,
  badgeSwatch,
  badgeSwatchShape,
  badgeSwatchOpacity,
  badgeSwatchMix,
  badgeSwatchBorderColor,
  badgeSwatchBorderWidth,
  badgeSwatchBorderOpacity,
  debugCircleOverlay,
  enabled,
  onEnabledToggle,
  children,
  popoverContent,
  scrollContainer,
  portalContainer,
  triangleMinRatio,
  triangleMaxRatio,
  dragHandleProps,
  dragHandleRef,
  sortableStyle,
  isDragging = false,
}: PrototypePopoverSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <PrototypeSectionCardShell
      title={title}
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
      style={sortableStyle}
      isDragging={isDragging}
      pillPopover={
        badge ? (
          <PrototypePillPopover
            open={open}
            onOpenChange={setOpen}
            value={badge}
            swatch={badgeSwatch}
            swatchShape={badgeSwatchShape}
            swatchOpacity={badgeSwatchOpacity}
            swatchMix={badgeSwatchMix}
            swatchBorderColor={badgeSwatchBorderColor}
            swatchBorderWidth={badgeSwatchBorderWidth}
            swatchBorderOpacity={badgeSwatchBorderOpacity}
            debugCircleOverlay={debugCircleOverlay}
            scrollContainer={scrollContainer}
            portalContainer={portalContainer}
            viewportContainer={scrollContainer}
            triangleMinRatio={triangleMinRatio}
            triangleMaxRatio={triangleMaxRatio}
          >
            {popoverContent}
          </PrototypePillPopover>
        ) : null
      }
      trailingControl={
        <PrototypeDragHandle
          ref={dragHandleRef}
          label={title}
          {...dragHandleProps}
        />
      }
      body={children}
    />
  );
}

function PrototypeSortablePopoverSection({
  id,
  ...props
}: PrototypeSortablePopoverSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <PrototypePopoverSection
        {...props}
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
}

function PrototypeCollapsiblePopoverSection({
  title,
  badge,
  badgeSwatch,
  badgeSwatchShape,
  badgeSwatchOpacity,
  badgeSwatchMix,
  badgeSwatchBorderColor,
  badgeSwatchBorderWidth,
  badgeSwatchBorderOpacity,
  debugCircleOverlay,
  enabled,
  onEnabledToggle,
  children,
  popoverContent,
  scrollContainer,
  portalContainer,
  defaultExpanded = true,
}: PrototypeCollapsiblePopoverSectionProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <PrototypeSectionCardShell
      title={title}
      enabled={enabled}
      onEnabledToggle={onEnabledToggle}
      pillPopover={
        badge ? (
          <PrototypePillPopover
            open={open}
            onOpenChange={setOpen}
            value={badge}
            swatch={badgeSwatch}
            swatchShape={badgeSwatchShape}
            swatchOpacity={badgeSwatchOpacity}
            swatchMix={badgeSwatchMix}
            swatchBorderColor={badgeSwatchBorderColor}
            swatchBorderWidth={badgeSwatchBorderWidth}
            swatchBorderOpacity={badgeSwatchBorderOpacity}
            debugCircleOverlay={debugCircleOverlay}
            scrollContainer={scrollContainer}
            portalContainer={portalContainer}
            viewportContainer={scrollContainer}
          >
            {popoverContent}
          </PrototypePillPopover>
        ) : null
      }
      trailingControl={
        <button
          type="button"
          className="prototype-disclosure-button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          <PrototypeChevronDownIcon
            className={`prototype-accordion-item__chevron${
              expanded ? ' is-open' : ''
            }`}
          />
        </button>
      }
      body={expanded ? children : null}
    />
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
  sortableStyle,
  dragHandleProps,
  dragHandleRef,
  isDragging = false,
}: PrototypeRegionRowProps) {
  const opacityValue = `${Math.round(styleState.opacity * 100)}%`;
  const controlSections = buildRegionControlSections(
    label,
    styleState,
    onStyleChange,
  );

  return (
    <PrototypeInlineRowShell
      label={label}
      enabled={enabled}
      onEnabledToggle={onToggle}
      style={sortableStyle}
      isDragging={isDragging}
      pillPopover={
        <PrototypePillPopover
          open={popoverOpen}
          onOpenChange={onPopoverOpenChange}
          scrollContainer={scrollContainer}
          portalContainer={portalContainer}
          viewportContainer={scrollContainer}
          value={opacityValue}
          swatch={styleState.color}
          swatchOpacity={styleState.pointsEnabled ? styleState.opacity : 0}
          swatchShape={styleState.shape}
          swatchBorderColor={styleState.borderColor}
          swatchBorderWidth={styleState.borderEnabled ? styleState.borderWidth : 0}
          swatchBorderOpacity={
            styleState.borderEnabled ? styleState.borderOpacity : 0
          }
        >
          {renderPrototypeControlSections(controlSections)}
        </PrototypePillPopover>
      }
      trailingControl={
        <PrototypeDragHandle
          ref={dragHandleRef}
          label={label}
          {...dragHandleProps}
        />
      }
    />
  );
}

function PrototypeSortableRegionRow({
  id,
  ...props
}: PrototypeSortableRegionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <PrototypeRegionRow
        {...props}
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
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
interface PrototypeSortableRegionRowProps extends PrototypeRegionRowProps {
  id: string;
}
