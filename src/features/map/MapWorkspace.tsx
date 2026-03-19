import { useEffect, useRef } from 'react';
import OLMap from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import {
  Fill,
  Stroke,
  Style,
  Circle as CircleStyle,
  RegularShape,
  Text as TextStyle,
} from 'ol/style';
import type {
  BasemapSettings,
  FacilitySymbolShape,
  LayerState,
  OverlayLayerStyle,
  RegionStyle,
  ViewPresetId,
} from '../../types';
import {
  getScenarioBoundaryLookupPresets,
  getScenarioLookupBoundaryPath,
  getScenarioRegionColor,
  getScenarioRegionName,
  isScenarioPreset,
} from '../../lib/config/viewPresets';
import {
  collectPointTooltipEntries,
  expandPointHitCluster,
  getDirectPointHitsAtPixel,
  getPointCoordinate,
  type PointTooltipEntry,
} from './pointSelection';
import { renderDockedTooltip } from './tooltipController';
import {
  getActiveAssignmentLookupSource,
  getActiveScenarioOutlineLookupSource,
} from './lookupSources';
import {
  loadOverlayAssignmentDataset,
  loadOverlayLookupDatasets,
  resolveDataUrl,
  type OverlayLookupDatasetDefinition,
} from './overlayLookupBootstrap';
import {
  cleanupMapWorkspaceRefs,
  initializeMapWorkspaceShell,
  type BasemapLayerSet,
} from './mapWorkspaceLifecycle';
import { getViewportFromMap, syncViewportToMap } from './viewportSync';
import {
  syncBoundaryHighlightForPoint,
  syncJmcOutlineHighlight,
} from './selectionHighlights';
import { resolveSingleClickSelection } from './singleClickSelection';
import {
  applyBoundarySelection,
  findCareBoardBoundaryAtCoordinate,
  findJmcNameAtCoordinate,
  findJmcNameForBoundarySelection,
  getBoundaryName,
  getSelectedJmcOutlineFeatures,
} from './boundarySelection';
import {
  getFacilityFeatureProperties,
  getFacilityRecord,
} from '../../lib/facilities';
import {
  createFacilityFilterState,
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
} from '../../lib/facilityFilters';
import { useAppStore } from '../../store/appStore';

export function MapWorkspace() {
  const layers = useAppStore((state) => state.layers);
  const regions = useAppStore((state) => state.regions);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const facilitySymbolShape = useAppStore((state) => state.facilitySymbolShape);
  const facilitySymbolSize = useAppStore((state) => state.facilitySymbolSize);
  const facilitySearchQuery = useAppStore((state) => state.facilitySearchQuery);
  const mapViewport = useAppStore((state) => state.mapViewport);
  const facilityFilters = getFacilityFilterDefinitions(
    createFacilityFilterState({ searchQuery: facilitySearchQuery }),
  );
  const loadLayers = useAppStore((state) => state.loadLayers);
  const basemap = useAppStore((state) => state.basemap);
  const overlayLayers = useAppStore((state) => state.overlayLayers);
  const setMapViewport = useAppStore((state) => state.setMapViewport);
  const setSelection = useAppStore((state) => state.setSelection);
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OLMap | null>(null);
  const basemapRef = useRef<BasemapLayerSet | null>(null);
  const regionBoundaryRefs = useRef<
    globalThis.Map<string, VectorLayer<VectorSource>>
  >(new globalThis.Map());
  const regionBoundaryPathRefs = useRef<globalThis.Map<string, string>>(
    new globalThis.Map(),
  );
  const selectedBoundaryRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedJmcBoundaryRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedPointRef = useRef<VectorLayer<VectorSource> | null>(null);
  const jmcBoundaryLookupSourceRef = useRef<VectorSource | null>(null);
  const scenarioBoundaryLookupSourcesRef = useRef<
    Map<ViewPresetId, VectorSource>
  >(new Map());
  const jmcAssignmentLookupSourceRef = useRef<VectorSource | null>(null);
  const jmcAssignmentByBoundaryNameRef = useRef<Map<string, string>>(new Map());
  const pointTooltipRootRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipHeaderRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipNameRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipSubnameRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipContextRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipFooterRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipPageRef = useRef<HTMLSpanElement | null>(null);
  const pointTooltipPrevRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipNextRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipEntriesRef = useRef<PointTooltipEntry[]>([]);
  const pointTooltipIndexRef = useRef(0);
  const selectedBoundaryNameRef = useRef<string | null>(null);
  const selectedJmcNameRef = useRef<string | null>(null);
  const layerRefs = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map(),
  );

  const renderPointTooltip = () => {
    pointTooltipIndexRef.current = renderDockedTooltip({
      dom: {
        root: pointTooltipRootRef.current,
        header: pointTooltipHeaderRef.current,
        name: pointTooltipNameRef.current,
        subname: pointTooltipSubnameRef.current,
        context: pointTooltipContextRef.current,
        footer: pointTooltipFooterRef.current,
        page: pointTooltipPageRef.current,
        prev: pointTooltipPrevRef.current,
        next: pointTooltipNextRef.current,
      },
      state: {
        entries: pointTooltipEntriesRef.current,
        index: pointTooltipIndexRef.current,
        boundaryName: selectedBoundaryNameRef.current,
        jmcName: selectedJmcNameRef.current,
      },
      facilitySymbolShape,
      facilitySymbolSize,
      selectedPointLayer: selectedPointRef.current,
      selectedJmcBoundaryLayer: selectedJmcBoundaryRef.current,
      setSelectedBoundaryForPoint: (entry) => {
        const nextState = syncBoundaryHighlightForPoint({
          entry,
          overlayLayers,
          regionBoundaryRefs: regionBoundaryRefs.current,
          selectedBoundaryLayer: selectedBoundaryRef.current,
        });
        selectedBoundaryNameRef.current = nextState.boundaryName;
        selectedJmcNameRef.current = nextState.jmcName;
      },
      syncSelectedJmcBoundaries: (entry) => {
        syncJmcOutlineHighlight({
          entry,
          activeViewPreset,
          selectedJmcBoundaryLayer: selectedJmcBoundaryRef.current,
          scenarioBoundarySource: getActiveScenarioOutlineLookupSource(
            regionBoundaryRefs.current,
            scenarioBoundaryLookupSourcesRef.current,
            activeViewPreset,
          ),
          jmcBoundaryLookupSource: jmcBoundaryLookupSourceRef.current,
          getSelectedOutlineColor: getSelectedJmcOutlineColor,
        });
      },
      setSelectedBoundaryState: (boundaryName, jmcName) => {
        selectedBoundaryNameRef.current = boundaryName;
        selectedJmcNameRef.current = jmcName;
      },
      createSelectedPointStyle,
    });

    const currentEntry = pointTooltipEntriesRef.current[pointTooltipIndexRef.current];
    if (currentEntry) {
      setSelection({
        facilityIds: currentEntry.facilityId ? [currentEntry.facilityId] : [],
        boundaryName: selectedBoundaryNameRef.current ?? currentEntry.boundaryName,
        jmcName: selectedJmcNameRef.current ?? currentEntry.jmcName,
      });
    } else {
      setSelection({
        facilityIds: [],
        boundaryName: selectedBoundaryNameRef.current,
        jmcName: selectedJmcNameRef.current,
      });
    }
  };

  useEffect(() => {
    if (!ref.current || mapRef.current) {
      return;
    }

    const shell = initializeMapWorkspaceShell({
      target: ref.current,
      createBasemapLayers,
      setBasemapSources,
      createSelectedBoundaryLayer,
      createSelectedJmcBoundaryLayer,
      createSelectedPointLayer,
    });
    mapRef.current = shell.map;
    basemapRef.current = shell.basemapLayers;
    selectedBoundaryRef.current = shell.selectedBoundaryLayer;
    selectedJmcBoundaryRef.current = shell.selectedJmcBoundaryLayer;
    selectedPointRef.current = shell.selectedPointLayer;
    setMapViewport(shell.initialViewport);

    const overlayRegionLookupSource = new VectorSource();
    jmcBoundaryLookupSourceRef.current = overlayRegionLookupSource;
    const overlayAssignmentSource = new VectorSource();
    jmcAssignmentLookupSourceRef.current = overlayAssignmentSource;
    const lookupDatasets: OverlayLookupDatasetDefinition<ViewPresetId>[] = [
      {
        key: 'current',
        path: 'data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson',
        source: overlayRegionLookupSource,
        errorLabel: 'Failed to load JMC lookup boundaries',
      },
    ];
    for (const preset of getScenarioBoundaryLookupPresets()) {
      const path = getScenarioLookupBoundaryPath(preset);
      if (!path) continue;
      const scenarioLookupSource = new VectorSource();
      scenarioBoundaryLookupSourcesRef.current.set(preset, scenarioLookupSource);
      lookupDatasets.push({
        key: preset,
        path,
        source: scenarioLookupSource,
        errorLabel: `Failed to load ${preset} boundary lookup`,
      });
    }
    void loadOverlayLookupDatasets({
      datasets: lookupDatasets,
      resolveUrl: resolveDataUrl,
      onError: (message, error) => {
        console.error(message, error);
      },
    });
    void loadOverlayAssignmentDataset({
      dataset: {
        path: 'data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson',
        source: overlayAssignmentSource,
        errorLabel: 'Failed to load JMC assignment lookup',
      },
      resolveUrl: resolveDataUrl,
      getBoundaryName: (feature) => String(feature.get('boundary_name') ?? ''),
      getAssignmentName: getJmcRegionName,
      onError: (message, error) => {
        console.error(message, error);
      },
    }).then((assignmentMap) => {
      jmcAssignmentByBoundaryNameRef.current = assignmentMap;
    });

    return () => {
      cleanupMapWorkspaceRefs({
        mapRef,
        basemapRef,
        regionBoundaryRefs,
        regionBoundaryPathRefs,
        selectedBoundaryRef,
        selectedJmcBoundaryRef,
        selectedPointRef,
        jmcBoundaryLookupSourceRef,
        scenarioBoundaryLookupSourcesRef,
        jmcAssignmentLookupSourceRef,
        jmcAssignmentByBoundaryNameRef,
        pointTooltipRootRef,
        pointTooltipHeaderRef,
        pointTooltipNameRef,
        pointTooltipSubnameRef,
        pointTooltipContextRef,
        pointTooltipFooterRef,
        pointTooltipPageRef,
        pointTooltipPrevRef,
        pointTooltipNextRef,
        pointTooltipEntriesRef,
        pointTooltipIndexRef,
        selectedBoundaryNameRef,
        selectedJmcNameRef,
        layerRefs,
      });
    };
  }, []);

  useEffect(() => {
    loadLayers().catch((error) => {
      console.error('Failed to load layers', error);
    });
  }, [loadLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncViewportToMap(map, mapViewport);
  }, [mapViewport]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const moveKey: EventsKey = map.on('moveend', () => {
      setMapViewport(getViewportFromMap(map));
    });

    return () => {
      unByKey(moveKey);
    };
  }, [setMapViewport]);

  useEffect(() => {
    const basemapLayers = basemapRef.current;
    if (!basemapLayers) return;
    const urls = getBasemapUrls();
    if (basemap.showSeaLabels) {
      ensureVectorSource(basemapLayers.seaLabels, urls.marineLabels);
    }
    if (basemap.showMajorCities) {
      ensureVectorSource(basemapLayers.majorCities, urls.populatedPlaces);
    }

    basemapLayers.oceanFill.setStyle(
      createFillStyle(
        withOpacity(basemap.seaFillColor, basemap.seaFillOpacity),
      ),
    );
    basemapLayers.landFill.setStyle(
      createFillStyle(
        withOpacity(basemap.landFillColor, basemap.landFillOpacity),
      ),
    );
    basemapLayers.oceanFill.setVisible(basemap.showSeaFill);
    basemapLayers.landFill.setVisible(basemap.showLandFill);
    basemapLayers.countryBorders.setVisible(basemap.showCountryBorders);
    basemapLayers.ukInternalBorders.setVisible(basemap.showCountryBorders);
    basemapLayers.countryLabels.setVisible(basemap.showCountryLabels);
    basemapLayers.majorCities.setVisible(basemap.showMajorCities);
    basemapLayers.seaLabels.setVisible(basemap.showSeaLabels);
    basemapLayers.countryBorders.setStyle(createCountryBorderStyle(basemap));
    basemapLayers.ukInternalBorders.setStyle(createCountryBorderStyle(basemap));
    basemapLayers.countryLabels.setStyle(createCountryLabelStyle(basemap));
    basemapLayers.seaLabels.setStyle(createSeaLabelStyle(basemap));
    basemapLayers.majorCities.setStyle(createMajorCityStyle(basemap));
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const byId = new globalThis.Map(overlayLayers.map((layer) => [layer.id, layer]));

    overlayLayers.forEach((layerConfig) => {
      let boundaryLayer = regionBoundaryRefs.current.get(layerConfig.id);
      if (!boundaryLayer) {
        boundaryLayer = createRegionBoundaryLayer(layerConfig, activeViewPreset);
        regionBoundaryRefs.current.set(layerConfig.id, boundaryLayer);
        map.addLayer(boundaryLayer);
      }

      const sourceUrl = new URL(
        layerConfig.path,
        new URL(import.meta.env.BASE_URL, window.location.origin),
      ).toString();
      const previousSourceUrl = regionBoundaryPathRefs.current.get(layerConfig.id);
      if (previousSourceUrl !== sourceUrl || !boundaryLayer.getSource()) {
        boundaryLayer.setSource(
          new VectorSource({
            url: sourceUrl,
            format: new GeoJSON(),
          }),
        );
        regionBoundaryPathRefs.current.set(layerConfig.id, sourceUrl);
      }
      boundaryLayer.setVisible(layerConfig.visible);
      boundaryLayer.setStyle(createRegionBoundaryStyle(layerConfig, activeViewPreset));
    });

    regionBoundaryRefs.current.forEach((layerRef, id) => {
      if (byId.has(id)) return;
      map.removeLayer(layerRef);
      regionBoundaryRefs.current.delete(id);
      regionBoundaryPathRefs.current.delete(id);
    });
  }, [overlayLayers, activeViewPreset]);

  useEffect(() => {
    renderPointTooltip();
  }, [facilitySymbolShape, facilitySymbolSize]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedBoundaryLayer = selectedBoundaryRef.current;
    const selectedJmcBoundaryLayer = selectedJmcBoundaryRef.current;
    if (!map || !selectedBoundaryLayer || !selectedJmcBoundaryLayer) return;

    const selectBoundary = (feature: Feature | null, coordinate?: [number, number]) => {
      const appliedSelection = applyBoundarySelection({
        feature,
        coordinate,
        selectedBoundaryLayer,
        selectedJmcBoundaryLayer,
        assignmentByBoundaryName: jmcAssignmentByBoundaryNameRef.current,
        assignmentSource: getActiveAssignmentLookupSource(
          regionBoundaryRefs.current,
          jmcAssignmentLookupSourceRef.current,
        ),
        boundarySource: jmcBoundaryLookupSourceRef.current,
        activeViewPreset,
      });
      selectedBoundaryNameRef.current = appliedSelection.boundaryName;
      selectedJmcNameRef.current = appliedSelection.jmcName;
      setSelection(appliedSelection.selection);
    };

    const clickKey: EventsKey = map.on('singleclick', (event) => {
      const selectionResult = resolveSingleClickSelection({
        map,
        pixel: event.pixel,
        coordinate: event.coordinate as [number, number],
        layers,
        regions,
        overlayLayers,
        layerRefs: layerRefs.current,
        regionBoundaryRefs: regionBoundaryRefs.current,
        facilitySymbolShape,
        facilitySymbolSize,
        facilitySearchQuery,
        activeViewPreset,
        getJmcNameAtCoordinate: (coordinate, preset) =>
          findJmcNameAtCoordinate(
            coordinate,
            getActiveAssignmentLookupSource(
              regionBoundaryRefs.current,
              jmcAssignmentLookupSourceRef.current,
            ),
            null,
            preset,
          ),
      });

      if (selectionResult.pointEntries.length > 0) {
        pointTooltipEntriesRef.current = selectionResult.pointEntries;
        pointTooltipIndexRef.current = 0;
        renderPointTooltip();
        return;
      }

      selectBoundary(
        selectionResult.boundaryFeature,
        event.coordinate as [number, number],
      );
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      renderPointTooltip();
    });

    return () => {
      unByKey(clickKey);
    };
  }, [
    overlayLayers,
    layers,
    regions,
    facilitySymbolShape,
    facilitySymbolSize,
    facilitySearchQuery,
    activeViewPreset,
    setSelection,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const regionByName = new Map<string, RegionStyle>(
      regions.map((region) => [region.name, region]),
    );

    const getVectorLayer = (layer: LayerState) => {
      const existing = layerRefs.current.get(layer.id);
      if (existing) return existing;

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          url: layer.path,
          format: new GeoJSON(),
        }),
        zIndex: layer.type === 'point' ? 35 : 1,
        style: getStyleForLayer(
          layer,
          regionByName,
          facilitySymbolShape,
          facilitySymbolSize,
          facilityFilters,
        ),
      });

      map.addLayer(vectorLayer);
      layerRefs.current.set(layer.id, vectorLayer);
      return vectorLayer;
    };

    layers.forEach((layer) => {
      const vectorLayer = getVectorLayer(layer);
      vectorLayer.setStyle(
        getStyleForLayer(
          layer,
          regionByName,
          facilitySymbolShape,
          facilitySymbolSize,
          facilityFilters,
        ),
      );
      vectorLayer.setVisible(layer.visible);
      vectorLayer.setOpacity(layer.opacity);
    });

    layerRefs.current.forEach((vectorLayer, id) => {
      const exists = layers.some((layer) => layer.id === id);
      if (!exists) {
        map.removeLayer(vectorLayer);
        layerRefs.current.delete(id);
      }
    });
  }, [
    layers,
    regions,
    facilitySymbolShape,
    facilitySymbolSize,
    facilitySearchQuery,
  ]);

  return (
    <main className="map-panel">
      <div className="map-panel__inner">
        <div
          className="map-tooltip-card map-tooltip-card--dock map-tooltip-card--hidden"
          ref={pointTooltipRootRef}
        >
          <div className="map-tooltip-card__header" ref={pointTooltipHeaderRef}>
            <div className="map-tooltip-card__name" ref={pointTooltipNameRef} />
            <div
              className="map-tooltip-card__footer map-tooltip-card__footer--hidden"
              ref={pointTooltipFooterRef}
            >
              <button
                type="button"
                className="map-tooltip-card__nav"
                ref={pointTooltipPrevRef}
                aria-label="Previous facility"
                onClick={() => {
                  if (pointTooltipIndexRef.current <= 0) return;
                  pointTooltipIndexRef.current -= 1;
                  renderPointTooltip();
                }}
              >
                {'<'}
              </button>
              <span className="map-tooltip-card__page" ref={pointTooltipPageRef} />
              <button
                type="button"
                className="map-tooltip-card__nav"
                ref={pointTooltipNextRef}
                aria-label="Next facility"
                onClick={() => {
                  if (
                    pointTooltipIndexRef.current >=
                    pointTooltipEntriesRef.current.length - 1
                  ) {
                    return;
                  }
                  pointTooltipIndexRef.current += 1;
                  renderPointTooltip();
                }}
              >
                {'>'}
              </button>
            </div>
          </div>
          <div
            className="map-tooltip-card__context map-tooltip-card__context--hidden"
            ref={pointTooltipContextRef}
          />
          <div
            className="map-tooltip-card__subname map-tooltip-card__subname--hidden"
            ref={pointTooltipSubnameRef}
          />
        </div>
        <div className="map-canvas" ref={ref} />
      </div>
    </main>
  );
}

function createRegionBoundaryLayer(
  layerConfig: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: createRegionBoundaryStyle(layerConfig, activeViewPreset),
    zIndex: getRegionBoundaryLayerZIndex(layerConfig),
  });
}

function createSelectedBoundaryLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: '#facc15',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0)',
      }),
    }),
    zIndex: 20,
  });
}

function createSelectedJmcBoundaryLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: (feature) =>
      new Style({
        stroke: new Stroke({
          color: String(feature.get('selectionColor') ?? '#419632'),
          width: 1.5,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
        }),
      }),
    zIndex: 25,
  });
}

function createSelectedPointLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: createSelectedPointStyle('circle', 6, false),
    zIndex: 40,
  });
}

function createSelectedPointStyle(
  shape: FacilitySymbolShape,
  size: number,
  hasVisibleBorder: boolean,
): Style {
  const highlightOffset = hasVisibleBorder ? 1.5 : 0.5;
  return new Style({
    image: createPointSymbol(
      shape,
      size + highlightOffset,
      'rgba(0, 0, 0, 0)',
      '#fffb00',
      2,
    ),
  });
}

function createBasemapLayers(): BasemapLayerSet {
  return {
    oceanFill: new VectorLayer({
      style: createFillStyle('#d9e7f5'),
      zIndex: -10,
    }),
    landFill: new VectorLayer({
      style: createFillStyle('#ecf0e6'),
      zIndex: -9,
    }),
    countryBorders: new VectorLayer({
      style: createCountryBorderStyle(undefined),
      zIndex: -8,
    }),
    ukInternalBorders: new VectorLayer({
      style: createCountryBorderStyle(undefined),
      zIndex: -8,
    }),
    countryLabels: new VectorLayer({
      declutter: true,
      style: createCountryLabelStyle(undefined),
      zIndex: -7,
    }),
    majorCities: new VectorLayer({
      declutter: false,
      style: createMajorCityStyle(undefined),
      zIndex: -6,
    }),
    seaLabels: new VectorLayer({
      declutter: true,
      style: createSeaLabelStyle(undefined),
      zIndex: -7,
    }),
  };
}

function setBasemapSources(
  layers: BasemapLayerSet,
): void {
  const urls = getBasemapUrls();

  layers.oceanFill.setSource(
    new VectorSource({
      url: urls.ocean,
      format: new GeoJSON(),
    }),
  );
  layers.landFill.setSource(
    new VectorSource({
      url: urls.land,
      format: new GeoJSON(),
    }),
  );
  const countriesSource = new VectorSource({
    url: urls.countries,
    format: new GeoJSON(),
  });
  layers.countryBorders.setSource(countriesSource);
  layers.ukInternalBorders.setSource(
    new VectorSource({
      url: urls.ukInternalBorders,
      format: new GeoJSON(),
    }),
  );
  layers.countryLabels.setSource(countriesSource);
  // Delay large/optional label sources until explicitly enabled.
}

function ensureVectorSource(layer: VectorLayer<VectorSource>, url: string): void {
  if (layer.getSource()) return;
  layer.setSource(
    new VectorSource({
      url,
      format: new GeoJSON(),
    }),
  );
}

function getBasemapUrls(): {
  ocean: string;
  land: string;
  countries: string;
  ukInternalBorders: string;
  marineLabels: string;
  populatedPlaces: string;
} {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);

  return {
    ocean: new URL('data/basemaps/ne_10m_ocean.geojson', baseUrl).toString(),
    land: new URL('data/basemaps/ne_10m_land.geojson', baseUrl).toString(),
    countries: new URL(
      'data/basemaps/ne_10m_admin_0_countries.geojson',
      baseUrl,
    ).toString(),
    ukInternalBorders: new URL(
      'data/basemaps/uk_internal_borders.geojson',
      baseUrl,
    ).toString(),
    marineLabels: new URL(
      'data/basemaps/ne_110m_geography_marine_polys.geojson',
      baseUrl,
    ).toString(),
    populatedPlaces: new URL(
      'data/basemaps/ne_110m_populated_places_simple.geojson',
      baseUrl,
    ).toString(),
  };
}

function createFillStyle(color: string) {
  return new Style({
    fill: new Fill({
      color,
    }),
    // A same-color stroke closes 1px anti-aliased seams at wrap joins.
    stroke: new Stroke({
      color,
      width: 1,
    }),
  });
}

function createCountryBorderStyle(basemap?: BasemapSettings) {
  return new Style({
    stroke: new Stroke({
      color: withOpacity(
        basemap?.countryBorderColor ?? '#EBEBEB',
        basemap?.countryBorderOpacity ?? 1,
      ),
      width: 1.2,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)',
    }),
  });
}

function createCountryLabelStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.countryLabelColor ?? '#0f172a',
    basemap?.countryLabelOpacity ?? 1,
  );
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const name = feature.get('NAME_LONG') ?? feature.get('NAME');
    if (!name) return undefined;
    const label = String(name);
    const existing = cache.get(label);
    if (existing) return existing;

    const style = new Style({
      text: new TextStyle({
        text: label,
        font: '12px Manrope, sans-serif',
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
    cache.set(label, style);
    return style;
  };
}

function createMajorCityStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.majorCityColor ?? '#1f2937',
    basemap?.majorCityOpacity ?? 1,
  );
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const isCapital = Number(getFeatureValue(feature, ['adm0cap', 'ADM0CAP']) ?? 0) === 1;
    const isWorldCity =
      Number(getFeatureValue(feature, ['worldcity', 'WORLDCITY']) ?? 0) === 1;
    const popMax = Number(
      getFeatureValue(feature, ['pop_max', 'POP_MAX', 'MAX_POP50']) ?? 0,
    );
    const labelRank = Number(
      getFeatureValue(feature, ['labelrank', 'LABELRANK', 'rank_max', 'RANK_MAX']) ?? 99,
    );
    const isMajorCity =
      isCapital || isWorldCity || popMax >= 1000000 || labelRank <= 2;
    if (!isMajorCity) return undefined;

    const name = getFeatureValue(feature, ['name', 'NAME', 'name_en', 'NAME_EN']);
    if (!name) return undefined;

    const label = String(name);
    const key = `${label}:${isCapital ? 1 : 0}`;
    const existing = cache.get(key);
    if (existing) return existing;

    const style = new Style({
      image: new CircleStyle({
        radius: isCapital ? 3 : 2.5,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 1 }),
      }),
      text: new TextStyle({
        text: label,
        font: '11px Manrope, sans-serif',
        offsetY: -10,
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
    cache.set(key, style);
    return style;
  };
}

function getFeatureValue(feature: FeatureLike, keys: string[]): unknown {
  for (const key of keys) {
    const value = feature.get(key);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function createSeaLabelStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.seaLabelColor ?? '#334155',
    basemap?.seaLabelOpacity ?? 1,
  );
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const name = feature.get('name_en') ?? feature.get('name');
    if (!name) return undefined;
    const label = String(name);
    const existing = cache.get(label);
    if (existing) return existing;

    const style = new Style({
      text: new TextStyle({
        text: label,
        font: 'italic 11px Manrope, sans-serif',
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
    cache.set(label, style);
    return style;
  };
}

function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createPointSymbol(
  shape: FacilitySymbolShape,
  size: number,
  fillColor: string,
  borderColor: string,
  borderWidth: number,
) {
  if (shape === 'circle') {
    return new CircleStyle({
      radius: size,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: borderColor, width: borderWidth }),
    });
  }

  if (shape === 'square') {
    return new RegularShape({
      points: 4,
      radius: size * 1.05,
      angle: Math.PI / 4,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: borderColor, width: borderWidth }),
    });
  }

  if (shape === 'diamond') {
    return new RegularShape({
      points: 4,
      radius: size * 1.05,
      angle: 0,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: borderColor, width: borderWidth }),
    });
  }

  return new RegularShape({
    points: 3,
    radius: size * 1.15,
    angle: 0,
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: borderColor, width: borderWidth }),
  });
}

function createRegionBoundaryStyle(
  layer: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
) {
  const cache = new Map<string, Style>();

  return (feature: FeatureLike) => {
    if (shouldHideRegionBoundaryFeature(layer, feature)) {
      return undefined;
    }

    const baseColor =
      getJmcBoundaryColor(feature, activeViewPreset) ??
      getFeatureBoundaryFillColor(feature) ??
      layer.swatchColor;
    const strokeColor = getFeatureBoundaryStrokeColor(layer, feature, baseColor);
    const strokeWidth = getFeatureBoundaryStrokeWidth(layer, feature);
    const fillOpacity = getFeatureBoundaryFillOpacity(layer, feature);
    const cacheKey = `${baseColor}:${strokeColor}:${strokeWidth}:${fillOpacity}`;
    const existing = cache.get(cacheKey);
    if (existing) return existing;

    const style = new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
      }),
      fill: new Fill({
        color: withOpacity(baseColor, fillOpacity),
      }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

function getFeatureBoundaryFillOpacity(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): number {
  if (layer.path.includes('UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson')) {
    return feature.get('is_populated') ? 0.3 : 0.2;
  }

  return layer.opacity;
}

function getFeatureBoundaryFillColor(feature: FeatureLike): string | null {
  const rawColor = String(feature.get('fill_color_hex') ?? '').replace('#', '');
  if (/^([0-9a-fA-F]{6})$/.test(rawColor)) {
    return `#${rawColor}`;
  }
  return null;
}

function getFeatureBoundaryStrokeColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
  baseColor: string,
): string {
  const featureLineColor = getFeatureBoundaryLineColor(layer, feature);
  const strokeBaseColor = featureLineColor ??
    (getUsesPerFeatureBoundaryColor(layer)
      ? baseColor
      : layer.borderColor);
  const strokeOpacity = featureLineColor
    ? getFeatureBoundaryLineOpacity(feature)
    : layer.borderOpacity;
  return withOpacity(strokeBaseColor, layer.borderVisible ? strokeOpacity : 0);
}

function getUsesPerFeatureBoundaryColor(layer: OverlayLayerStyle): boolean {
  return (
    layer.path.includes('UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson')
  );
}

function getFeatureBoundaryLineColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): string | null {
  if (!layer.path.includes('UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson')) {
    return null;
  }
  const rawColor = String(feature.get('line_color_hex') ?? '').replace('#', '');
  if (/^([0-9a-fA-F]{6})$/.test(rawColor)) {
    return `#${rawColor}`;
  }
  return null;
}

function getFeatureBoundaryLineOpacity(feature: FeatureLike): number {
  const alpha = Number(feature.get('line_alpha'));
  if (Number.isFinite(alpha)) {
    return Math.max(0, Math.min(1, alpha / 100));
  }
  return 1;
}

function getFeatureBoundaryStrokeWidth(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): number {
  if (!layer.borderVisible) return 0;
  if (
    isCoa3aLondonDistrictOverlay(layer, feature) ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson')
  ) {
    return 1.5;
  }
  const rawWidth = Number(feature.get('line_width'));
  if (
    layer.path.includes('UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson') &&
    Number.isFinite(rawWidth) &&
    rawWidth > 0
  ) {
    return Math.max(0.75, Math.min(2, rawWidth));
  }
  return 1;
}

function shouldHideRegionBoundaryFeature(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) !== 'London District'
  );
}

function isCoa3aLondonDistrictOverlay(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) === 'London District'
  );
}

function isCoa3aLondonDistrictOverlayLayer(layer: OverlayLayerStyle): boolean {
  return (
    layer.id === 'pmcUnpopulatedCareBoardBoundaries' &&
    layer.path.includes('UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson')
  );
}

function getJmcRegionName(feature: FeatureLike): string {
  return String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim();
}

function getJmcBoundaryColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const sourceRegionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  const regionName = getScenarioJmcName(feature, activeViewPreset);
  if (!regionName) return null;

  const populationState = feature.get('is_populated') ? 'populated' : 'unpopulated';
  return getScenarioRegionColor(
    activeViewPreset,
    sourceRegionName,
    boundaryName,
    populationState,
  );
}

function getSelectedJmcOutlineColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const sourceRegionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  return getScenarioRegionColor(
    activeViewPreset,
    sourceRegionName,
    boundaryName,
    'outline',
  );
}

function getScenarioJmcName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string {
  const regionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  return getScenarioRegionName(activeViewPreset, regionName, boundaryName);
}

function getRegionBoundaryLayerZIndex(layer: OverlayLayerStyle): number {
  if (isCoa3aLondonDistrictOverlayLayer(layer)) {
    return 7;
  }
  if (layer.id === 'pmcUnpopulatedCareBoardBoundaries') {
    return 4;
  }
  if (layer.id === 'pmcPopulatedCareBoardBoundaries') {
    return 5;
  }
  if (layer.id === 'careBoardBoundaries') {
    return 6;
  }
  return 4;
}

function getStyleForLayer(
  layer: LayerState,
  regions: Map<string, RegionStyle>,
  symbolShape: FacilitySymbolShape,
  symbolSize: number,
  facilityFilters: ReturnType<typeof getFacilityFilterDefinitions>,
) {
  if (layer.type === 'point') {
    const cache = new Map<string, Style>();
    return (feature: FeatureLike) => {
      const facility = getFacilityRecord(feature);
      if (!matchesFacilityFilters(facility, facilityFilters)) {
        return undefined;
      }

      const properties = getFacilityFeatureProperties(feature);
      const regionName = facility.region;
      const regionStyle = regions.get(regionName);
      const defaultVisible = facility.isDefaultVisible;
      if ((regionStyle && !regionStyle.visible) || (!regionStyle && !defaultVisible)) {
        return undefined;
      }

      const hex = regionStyle?.color ?? properties.point_color_hex;
      const opacity = regionStyle ? regionStyle.opacity : 1;
      const borderVisible = regionStyle?.borderVisible ?? true;
      const borderColor = regionStyle?.borderColor ?? '#ffffff';
      const borderOpacity = regionStyle?.borderOpacity ?? 1;
      const resolvedSize = regionStyle?.symbolSize ?? symbolSize;
      const key = `${hex}:${opacity}:${borderVisible}:${borderColor}:${borderOpacity}:${symbolShape}:${resolvedSize}`;
      const existing = cache.get(key);
      if (existing) {
        return existing;
      }

      const style = new Style({
        image: createPointSymbol(
          symbolShape,
          resolvedSize,
          withOpacity(hex, opacity),
          withOpacity(borderColor, borderOpacity),
          borderVisible ? 1 : 0,
        ),
      });
      cache.set(key, style);
      return style;
    };
  }

  return new Style({
    stroke: new Stroke({
      color: '#2b4c7e',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(43, 76, 126, 0.15)',
    }),
  });
}
