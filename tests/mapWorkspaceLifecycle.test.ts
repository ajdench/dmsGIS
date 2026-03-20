import { describe, expect, it } from 'vitest';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  cleanupMapWorkspaceRefs,
  initializeMapWorkspaceShell,
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

    expect(layers).toHaveLength(10);
    expect(shell.initialViewport).toEqual({
      center: [10, 20],
      zoom: 5.6,
      rotation: 0,
    });
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
    const scenarioWorkspaceAssignmentSourceRef = { current: new VectorSource() };
    const jmcAssignmentByBoundaryNameRef = { current: new Map([['A', 'B']]) };
    const scenarioWorkspaceAssignmentByBoundaryNameRef = {
      current: new Map([['Boundary A', 'COA 3b North']]),
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
      scenarioWorkspaceAssignmentSourceRef,
      jmcAssignmentByBoundaryNameRef,
      scenarioWorkspaceAssignmentByBoundaryNameRef,
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
    expect(scenarioWorkspaceAssignmentSourceRef.current).toBeNull();
    expect(jmcAssignmentByBoundaryNameRef.current.size).toBe(0);
    expect(scenarioWorkspaceAssignmentByBoundaryNameRef.current.size).toBe(0);
    expect(pointTooltipEntriesRef.current).toEqual([]);
    expect(pointTooltipIndexRef.current).toBe(0);
    expect(selectedBoundaryNameRef.current).toBeNull();
    expect(selectedJmcNameRef.current).toBeNull();
    expect(layerRefs.current.size).toBe(0);
  });
});
