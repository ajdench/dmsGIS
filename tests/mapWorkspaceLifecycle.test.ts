/* @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  attachCrosshairGuideControl,
  cleanupMapWorkspaceRefs,
  fitMapToUkExtentOnLoad,
  getMapViewportDiagnostics,
  getMapZoomPercentage,
  getInitialUkFitPaddingPx,
  getUnitedKingdomExtentFromCountrySource,
  initializeMapWorkspaceShell,
  resetTransientMapSelectionState,
} from '../src/features/map/mapWorkspaceLifecycle';

describe('mapWorkspaceLifecycle', () => {
  it('initializes the map shell with basemap and selection layers', () => {
    const layers: VectorLayer<VectorSource>[] = [];
    const shell = initializeMapWorkspaceShell({
      target: {} as HTMLDivElement,
      createBasemapLayers: () => ({
        oceanFill: new VectorLayer(),
        landFill: new VectorLayer(),
        countryBorders: new VectorLayer(),
        ukAlignmentMask: new VectorLayer(),
        ukAlignedLandFill: new VectorLayer(),
        ukInternalBorders: new VectorLayer(),
        countryLabels: new VectorLayer(),
        majorCities: new VectorLayer(),
        seaLabels: new VectorLayer(),
      }),
      setBasemapSources() {},
      createSelectedBoundaryLayer: () => new VectorLayer(),
      createSelectedJmcBoundaryLayer: () => new VectorLayer(),
      createSelectedPointLayer: () => new VectorLayer(),
      createMap: () =>
        ({
          addLayer(layer: VectorLayer<VectorSource>) {
            layers.push(layer);
          },
          getView() {
            return {
              getCenter: () => [10, 20],
              getZoom: () => 5.6,
              getRotation: () => 0,
            };
          },
        }) as never,
    });

    expect(layers).toHaveLength(12);
    expect(shell.initialViewport).toEqual({
      center: [10, 20],
      zoom: 5.6,
      rotation: 0,
    });
  });

  it('attaches a square placeholder pane sized from the zoom control', () => {
    const target = document.createElement('div');
    target.className = 'map-canvas';
    const zoomControl = document.createElement('div');
    zoomControl.className = 'ol-zoom';
    target.append(zoomControl);
    document.body.append(target);

    zoomControl.getBoundingClientRect = () =>
      ({
        top: 12,
        right: 92,
        bottom: 132,
        left: 12,
        width: 80,
        height: 120,
        x: 12,
        y: 12,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    const cleanup = attachCrosshairGuideControl({ target });
    const control = target.querySelector<HTMLElement>('.map-crosshair-control');

    expect(control).not.toBeNull();
    expect(control?.style.inlineSize).toBe('80px');
    expect(control?.style.blockSize).toBe('80px');
    expect(control?.getAttribute('aria-hidden')).toBe('true');

    cleanup();

    expect(target.querySelector('.map-crosshair-control')).toBeNull();
    target.remove();
  });

  it('derives viewport diagnostics from projected extents', () => {
    const diagnostics = getMapViewportDiagnostics(
      [-100, -50, 100, 50],
      [-200, -100, 200, 100],
      800,
      400,
      12,
      10,
    );

    expect(diagnostics.horizontalCoveragePercentage).toBe(50);
    expect(diagnostics.verticalCoveragePercentage).toBe(50);
    expect(diagnostics.geographicWidthDegrees).toBeGreaterThan(0);
    expect(diagnostics.geographicHeightDegrees).toBeGreaterThan(0);
    expect(diagnostics.geographicCenterLongitudeDegrees).toBe(0);
    expect(diagnostics.geographicCenterLatitudeDegrees).toBe(0);
    expect(diagnostics.viewportWidthPx).toBe(800);
    expect(diagnostics.viewportHeightPx).toBe(400);
    expect(diagnostics.currentResolution3857).toBe(12);
    expect(diagnostics.floorResolution3857).toBe(10);
  });

  it('cleans up map refs and transient selection state', () => {
    const mapRef = {
      current: {
        setTarget() {},
      },
    };
    const basemapRef = { current: {} };
    const regionBoundaryRefs = { current: new Map([['a', new VectorLayer()]]) };
    const regionBoundaryPathRefs = { current: new Map([['a', 'path']]) };
    const selectedBoundaryRef = { current: new VectorLayer() };
    const selectedJmcBoundaryRef = { current: new VectorLayer() };
    const selectedPointRef = { current: new VectorLayer() };
    const boundarySystemLookupSourcesRef = {
      current: new Map([['legacyIcbHb', new VectorSource()] as const]),
    };
    const jmcBoundaryLookupSourceRef = { current: new VectorSource() };
    const scenarioBoundaryLookupSourcesRef = {
      current: new Map([['coa3a', new VectorSource()] as const]),
    };
    const jmcAssignmentLookupSourceRef = { current: new VectorSource() };
    const scenarioWorkspaceBaselineAssignmentSourceRef = {
      current: new VectorSource(),
    };
    const scenarioTopologyEdgeSourceRef = { current: new VectorSource() };
    const scenarioWorkspaceDerivedOutlineSourceRef = { current: new VectorSource() };
    const presetGroupOutlineSourceRef = { current: new VectorSource() };
    const jmcAssignmentByBoundaryNameRef = { current: new Map([['A', 'B']]) };
    const jmcAssignmentByBoundaryUnitIdRef = { current: new Map() };
    const scenarioAssignmentSourceRef = { current: new VectorSource() };
    const scenarioAssignmentByBoundaryNameRef = {
      current: new Map([['Boundary B', 'COA 3b South East']]),
    };
    const scenarioAssignmentByBoundaryUnitIdRef = {
      current: new Map([
        [
          'UNIT-2',
          {
            boundaryUnitId: 'UNIT-2',
            boundaryName: 'Boundary B',
            boundaryCode: 'CODE-2',
            scenarioRegionId: 'region-2',
            regionName: 'Region 2',
          },
        ],
      ]),
    };
    const pointTooltipRootRef = { current: {} };
    const pointTooltipHeaderRef = { current: {} };
    const pointTooltipNameRef = { current: {} };
    const pointTooltipSubnameRef = { current: {} };
    const pointTooltipContextRef = { current: {} };
    const pointTooltipFooterRef = { current: {} };
    const pointTooltipPageRef = { current: {} };
    const pointTooltipPrevRef = { current: {} };
    const pointTooltipNextRef = { current: {} };
    const pointTooltipEntriesRef = { current: [{ facilityId: 'FAC-1' }] as never[] };
    const pointTooltipIndexRef = { current: 2 };
    const selectedBoundaryNameRef = { current: 'Boundary A' };
    const selectedJmcNameRef = { current: 'JMC North' };
    const layerRefs = { current: new Map([['facilities', new VectorLayer()]]) };

    cleanupMapWorkspaceRefs({
      mapRef: mapRef as never,
      basemapRef: basemapRef as never,
      regionBoundaryRefs,
      regionBoundaryPathRefs,
      selectedBoundaryRef,
      selectedJmcBoundaryRef,
      selectedPointRef,
      boundarySystemLookupSourcesRef,
      jmcBoundaryLookupSourceRef,
      scenarioBoundaryLookupSourcesRef,
      jmcAssignmentLookupSourceRef,
      scenarioAssignmentSourceRef,
      scenarioWorkspaceBaselineAssignmentSourceRef,
      scenarioTopologyEdgeSourceRef,
      scenarioWorkspaceDerivedOutlineSourceRef,
      presetGroupOutlineSourceRef,
      jmcAssignmentByBoundaryNameRef,
      jmcAssignmentByBoundaryUnitIdRef,
      scenarioAssignmentByBoundaryNameRef,
      scenarioAssignmentByBoundaryUnitIdRef,
      pointTooltipRootRef: pointTooltipRootRef as never,
      pointTooltipHeaderRef: pointTooltipHeaderRef as never,
      pointTooltipNameRef: pointTooltipNameRef as never,
      pointTooltipSubnameRef: pointTooltipSubnameRef as never,
      pointTooltipContextRef: pointTooltipContextRef as never,
      pointTooltipFooterRef: pointTooltipFooterRef as never,
      pointTooltipPageRef: pointTooltipPageRef as never,
      pointTooltipPrevRef: pointTooltipPrevRef as never,
      pointTooltipNextRef: pointTooltipNextRef as never,
      pointTooltipEntriesRef,
      pointTooltipIndexRef,
      selectedBoundaryNameRef,
      selectedJmcNameRef,
      layerRefs,
    });

    expect(mapRef.current).toBeNull();
    expect(basemapRef.current).toBeNull();
    expect(regionBoundaryRefs.current.size).toBe(0);
    expect(regionBoundaryPathRefs.current.size).toBe(0);
    expect(selectedBoundaryRef.current).toBeNull();
    expect(selectedJmcBoundaryRef.current).toBeNull();
    expect(selectedPointRef.current).toBeNull();
    expect(boundarySystemLookupSourcesRef.current.size).toBe(0);
    expect(jmcBoundaryLookupSourceRef.current).toBeNull();
    expect(scenarioBoundaryLookupSourcesRef.current.size).toBe(0);
    expect(jmcAssignmentLookupSourceRef.current).toBeNull();
    expect(scenarioAssignmentSourceRef.current).toBeNull();
    expect(scenarioWorkspaceBaselineAssignmentSourceRef.current).toBeNull();
    expect(scenarioTopologyEdgeSourceRef.current).toBeNull();
    expect(scenarioWorkspaceDerivedOutlineSourceRef.current).toBeNull();
    expect(presetGroupOutlineSourceRef.current).toBeNull();
    expect(jmcAssignmentByBoundaryNameRef.current.size).toBe(0);
    expect(jmcAssignmentByBoundaryUnitIdRef.current.size).toBe(0);
    expect(scenarioAssignmentByBoundaryNameRef.current.size).toBe(0);
    expect(scenarioAssignmentByBoundaryUnitIdRef.current.size).toBe(0);
    expect(pointTooltipEntriesRef.current).toEqual([]);
    expect(pointTooltipIndexRef.current).toBe(0);
    expect(selectedBoundaryNameRef.current).toBeNull();
    expect(selectedJmcNameRef.current).toBeNull();
    expect(layerRefs.current.size).toBe(0);
  });

  it('clears live highlight layers and hides the docked tooltip', () => {
    const selectedBoundaryRef = { current: new VectorLayer({ source: new VectorSource() }) };
    const selectedJmcBoundaryRef = { current: new VectorLayer({ source: new VectorSource() }) };
    const selectedPointRef = { current: new VectorLayer({ source: new VectorSource() }) };
    selectedBoundaryRef.current
      .getSource()
      ?.addFeature(new Feature({ geometry: new Point([0, 0]) }));
    selectedJmcBoundaryRef.current
      .getSource()
      ?.addFeature(new Feature({ geometry: new Point([0, 0]) }));
    selectedPointRef.current
      .getSource()
      ?.addFeature(new Feature({ geometry: new Point([0, 0]) }));

    const hiddenClasses = new Set<string>();
    const subnameClasses = new Set<string>();
    const contextClasses = new Set<string>();
    const footerClasses = new Set<string>();
    const pointTooltipRootRef = {
      current: {
        classList: {
          add(className: string) {
            hiddenClasses.add(className);
          },
          remove(className: string) {
            hiddenClasses.delete(className);
          },
        },
      },
    };
    const pointTooltipNameRef = { current: { textContent: 'Facility A' } };
    const pointTooltipSubnameRef = {
      current: {
        textContent: 'Region A',
        classList: {
          add(className: string) {
            subnameClasses.add(className);
          },
        },
      },
    };
    const pointTooltipContextRef = {
      current: {
        textContent: 'Boundary A',
        classList: {
          add(className: string) {
            contextClasses.add(className);
          },
        },
      },
    };
    const pointTooltipFooterRef = {
      current: {
        classList: {
          add(className: string) {
            footerClasses.add(className);
          },
        },
      },
    };
    const pointTooltipPageRef = { current: { textContent: 'Page 1 of 2' } };
    const pointTooltipPrevRef = { current: { disabled: false } };
    const pointTooltipNextRef = { current: { disabled: false } };
    const pointTooltipEntriesRef = { current: [{ facilityId: 'FAC-1' }] as never[] };
    const pointTooltipIndexRef = { current: 1 };
    const selectedBoundaryNameRef = { current: 'Boundary A' };
    const selectedJmcNameRef = { current: 'Region A' };

    resetTransientMapSelectionState({
      selectedBoundaryRef,
      selectedJmcBoundaryRef,
      selectedPointRef,
      pointTooltipRootRef: pointTooltipRootRef as never,
      pointTooltipNameRef: pointTooltipNameRef as never,
      pointTooltipSubnameRef: pointTooltipSubnameRef as never,
      pointTooltipContextRef: pointTooltipContextRef as never,
      pointTooltipFooterRef: pointTooltipFooterRef as never,
      pointTooltipPageRef: pointTooltipPageRef as never,
      pointTooltipPrevRef: pointTooltipPrevRef as never,
      pointTooltipNextRef: pointTooltipNextRef as never,
      pointTooltipEntriesRef,
      pointTooltipIndexRef,
      selectedBoundaryNameRef,
      selectedJmcNameRef,
    });

    expect(selectedBoundaryRef.current.getSource()?.getFeatures()).toHaveLength(0);
    expect(selectedJmcBoundaryRef.current.getSource()?.getFeatures()).toHaveLength(0);
    expect(selectedPointRef.current.getSource()?.getFeatures()).toHaveLength(0);
    expect(pointTooltipEntriesRef.current).toEqual([]);
    expect(pointTooltipIndexRef.current).toBe(0);
    expect(selectedBoundaryNameRef.current).toBeNull();
    expect(selectedJmcNameRef.current).toBeNull();
    expect(pointTooltipNameRef.current.textContent).toBe('');
    expect(pointTooltipSubnameRef.current.textContent).toBe('');
    expect(pointTooltipContextRef.current.textContent).toBe('');
    expect(pointTooltipPageRef.current.textContent).toBe('');
    expect(pointTooltipPrevRef.current.disabled).toBe(true);
    expect(pointTooltipNextRef.current.disabled).toBe(true);
    expect(hiddenClasses.has('map-tooltip-card--hidden')).toBe(true);
    expect(subnameClasses.has('map-tooltip-card__subname--hidden')).toBe(true);
    expect(contextClasses.has('map-tooltip-card__context--hidden')).toBe(true);
    expect(footerClasses.has('map-tooltip-card__footer--hidden')).toBe(true);
  });

  it('uses doubled default top and bottom padding for the initial UK fit', () => {
    expect(getInitialUkFitPaddingPx()).toEqual([24, 12, 24, 12]);
  });

  it('fits the map to the loaded UK extent and updates viewport state', () => {
    const source = new VectorSource();
    source.addFeature(
      new Feature({
        ADMIN: 'United Kingdom',
        geometry: new Polygon([[
          [100, 200],
          [300, 200],
          [300, 500],
          [100, 500],
          [100, 200],
        ]]),
      }),
    );

    const fitCalls: unknown[] = [];
    const viewportUpdates: unknown[] = [];
    const view = {
      fit: (extent: unknown, options: unknown) => {
        fitCalls.push({ extent, options });
      },
      getCenter: () => [10, 20],
      getZoom: () => 5.5,
      getRotation: () => 0,
    };
    const map = {
      getView: () => view,
      getSize: () => [900, 600],
    } as never;

    fitMapToUkExtentOnLoad({
      map,
      source,
      target: undefined as never,
      getExtent: getUnitedKingdomExtentFromCountrySource,
      onViewportChange: (viewport) => {
        viewportUpdates.push(viewport);
      },
    });

    expect(fitCalls).toHaveLength(1);
    expect(fitCalls[0]).toMatchObject({
      extent: [100, 200, 300, 500],
      options: {
        padding: [24, 12, 24, 12],
        duration: 0,
        nearest: true,
        size: [900, 600],
      },
    });
    expect(viewportUpdates).toEqual([
      {
        center: [10, 20],
        zoom: 5.5,
        rotation: 0,
      },
    ]);
  });

  it('maps whole-world minimum zoom to 0 percent', () => {
    expect(getMapZoomPercentage(3, 3, 10)).toBe(0);
    expect(getMapZoomPercentage(10, 3, 10)).toBe(100);
    expect(getMapZoomPercentage(6.5, 3, 10)).toBe(50);
  });
});
