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
  RegionBoundaryLayerStyle,
  RegionStyle,
} from '../../types';
import { useAppStore } from '../../store/appStore';

interface BasemapLayerSet {
  oceanFill: VectorLayer<VectorSource>;
  landFill: VectorLayer<VectorSource>;
  countryBorders: VectorLayer<VectorSource>;
  ukInternalBorders: VectorLayer<VectorSource>;
  countryLabels: VectorLayer<VectorSource>;
  majorCities: VectorLayer<VectorSource>;
  seaLabels: VectorLayer<VectorSource>;
}

interface PointTooltipEntry {
  facilityName: string;
  coordinate: [number, number];
  boundaryName: string | null;
  hasVisibleBorder: boolean;
  symbolSize: number;
  jmcName: string | null;
}

export function MapWorkspace() {
  const layers = useAppStore((state) => state.layers);
  const regions = useAppStore((state) => state.regions);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const facilitySymbolShape = useAppStore((state) => state.facilitySymbolShape);
  const facilitySymbolSize = useAppStore((state) => state.facilitySymbolSize);
  const loadLayers = useAppStore((state) => state.loadLayers);
  const basemap = useAppStore((state) => state.basemap);
  const regionBoundaryLayers = useAppStore((state) => state.regionBoundaryLayers);
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
  const coa3aBoundaryLookupSourceRef = useRef<VectorSource | null>(null);
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
    const root = pointTooltipRootRef.current;
    const header = pointTooltipHeaderRef.current;
    const name = pointTooltipNameRef.current;
    const subname = pointTooltipSubnameRef.current;
    const context = pointTooltipContextRef.current;
    const footer = pointTooltipFooterRef.current;
    const page = pointTooltipPageRef.current;
    const prev = pointTooltipPrevRef.current;
    const next = pointTooltipNextRef.current;
    if (
      !root ||
      !header ||
      !name ||
      !subname ||
      !context ||
      !footer ||
      !page ||
      !prev ||
      !next
    ) {
      return;
    }

    const entries = pointTooltipEntriesRef.current;
    const selectedPointSource = selectedPointRef.current?.getSource();
    const selectedPointLayer = selectedPointRef.current;
    const selectedJmcSource = selectedJmcBoundaryRef.current?.getSource();
    if (entries.length === 0) {
      const boundaryName = selectedBoundaryNameRef.current;
      const jmcName = selectedJmcNameRef.current;
      if (!boundaryName) {
        name.textContent = '';
        subname.textContent = '';
        context.textContent = '';
        page.textContent = '';
        prev.disabled = true;
        next.disabled = true;
        footer.classList.add('map-tooltip-card__footer--hidden');
        subname.classList.add('map-tooltip-card__subname--hidden');
        context.classList.add('map-tooltip-card__context--hidden');
        root.classList.remove('map-tooltip-card--name-right');
        root.classList.add('map-tooltip-card--hidden');
        if (selectedPointSource) {
          selectedPointSource.clear();
        }
        if (selectedPointLayer) {
          selectedPointLayer.setStyle(
            createSelectedPointStyle(facilitySymbolShape, facilitySymbolSize, false),
          );
        }
        if (selectedJmcSource) {
          selectedJmcSource.clear();
        }
        return;
      }

      name.textContent = boundaryName;
      subname.textContent = jmcName ?? '';
      context.textContent = '';
      page.textContent = '';
      prev.disabled = true;
      next.disabled = true;
      footer.classList.add('map-tooltip-card__footer--hidden');
      if (jmcName) {
        subname.classList.remove('map-tooltip-card__subname--hidden');
      } else {
        subname.classList.add('map-tooltip-card__subname--hidden');
      }
      context.classList.add('map-tooltip-card__context--hidden');
      root.classList.remove('map-tooltip-card--name-right');
      root.classList.remove('map-tooltip-card--hidden');
      if (selectedPointSource) {
        selectedPointSource.clear();
      }
      if (selectedPointLayer) {
        selectedPointLayer.setStyle(
          createSelectedPointStyle(facilitySymbolShape, facilitySymbolSize, false),
        );
      }
      if (selectedJmcSource) {
        selectedJmcSource.clear();
      }
      return;
    }

    const index = Math.max(
      0,
      Math.min(pointTooltipIndexRef.current, entries.length - 1),
    );
    pointTooltipIndexRef.current = index;
    const current = entries[index];
    name.textContent = current.facilityName;
    subname.textContent = current.jmcName ?? '';
    page.textContent = `Page ${index + 1} of ${entries.length}`;
    context.textContent = current.boundaryName ?? '';
    prev.disabled = index === 0;
    next.disabled = index >= entries.length - 1;
    footer.classList.remove('map-tooltip-card__footer--hidden');
    if (current.jmcName) {
      subname.classList.remove('map-tooltip-card__subname--hidden');
    } else {
      subname.classList.add('map-tooltip-card__subname--hidden');
    }
    if (current.boundaryName) {
      context.classList.remove('map-tooltip-card__context--hidden');
    } else {
      context.classList.add('map-tooltip-card__context--hidden');
    }

    const selectedBoundarySource = selectedBoundaryRef.current?.getSource();
    if (selectedBoundarySource) {
      selectedBoundarySource.clear();
      const matchedBoundary = findCareBoardBoundaryAtCoordinate(
        current.coordinate,
        regionBoundaryLayers,
        regionBoundaryRefs.current,
      );
      if (matchedBoundary) {
        selectedBoundarySource.addFeature(matchedBoundary.clone());
        selectedBoundaryNameRef.current = getBoundaryName(matchedBoundary);
        selectedJmcNameRef.current = current.jmcName;
      } else {
        selectedBoundaryNameRef.current = null;
        selectedJmcNameRef.current = current.jmcName;
      }
    }

    if (selectedJmcSource) {
      selectedJmcSource.clear();
      const liveScenarioBoundarySource = regionBoundaryRefs.current
        .get('pmcUnpopulatedCareBoardBoundaries')
        ?.getSource();
      const activeScenarioBoundarySource =
        liveScenarioBoundarySource && liveScenarioBoundarySource.getFeatures().length > 0
          ? liveScenarioBoundarySource
          : coa3aBoundaryLookupSourceRef.current;
      const matchedJmcBoundaries = getSelectedJmcOutlineFeatures(
        current.coordinate,
        current.jmcName,
        activeViewPreset,
        activeScenarioBoundarySource,
        jmcBoundaryLookupSourceRef.current,
      );
      for (const boundary of matchedJmcBoundaries) {
        const outline = boundary.clone();
        outline.set(
          'selectionColor',
          getSelectedJmcOutlineColor(boundary, activeViewPreset),
        );
        selectedJmcSource.addFeature(outline);
      }
    }

    root.classList.remove('map-tooltip-card--name-right');
    root.classList.remove('map-tooltip-card--hidden');
    if (selectedPointSource) {
      selectedPointSource.clear();
      selectedPointSource.addFeature(
        new Feature({
          geometry: new Point(current.coordinate),
        }),
      );
    }
    if (selectedPointLayer) {
      selectedPointLayer.setStyle(
        createSelectedPointStyle(
          facilitySymbolShape,
          current.symbolSize,
          current.hasVisibleBorder,
        ),
      );
    }
  };

  useEffect(() => {
    if (!ref.current || mapRef.current) {
      return;
    }

    mapRef.current = new OLMap({
      target: ref.current,
      view: new View({
        center: fromLonLat([-2.5, 54.5]),
        zoom: 5.6,
      }),
      layers: [],
    });

    const basemapLayers = createBasemapLayers();
    basemapRef.current = basemapLayers;
    setBasemapSources(basemapLayers);
    mapRef.current.addLayer(basemapLayers.oceanFill);
    mapRef.current.addLayer(basemapLayers.landFill);
    mapRef.current.addLayer(basemapLayers.countryBorders);
    mapRef.current.addLayer(basemapLayers.ukInternalBorders);
    mapRef.current.addLayer(basemapLayers.seaLabels);
    mapRef.current.addLayer(basemapLayers.countryLabels);
    mapRef.current.addLayer(basemapLayers.majorCities);
    const selectedBoundaryLayer = createSelectedBoundaryLayer();
    selectedBoundaryRef.current = selectedBoundaryLayer;
    mapRef.current.addLayer(selectedBoundaryLayer);
    const selectedJmcBoundaryLayer = createSelectedJmcBoundaryLayer();
    selectedJmcBoundaryRef.current = selectedJmcBoundaryLayer;
    mapRef.current.addLayer(selectedJmcBoundaryLayer);
    const selectedPointLayer = createSelectedPointLayer();
    selectedPointRef.current = selectedPointLayer;
    mapRef.current.addLayer(selectedPointLayer);

    const jmcLookupSource = new VectorSource();
    jmcBoundaryLookupSourceRef.current = jmcLookupSource;
    const coa3aBoundaryLookupSource = new VectorSource();
    coa3aBoundaryLookupSourceRef.current = coa3aBoundaryLookupSource;
    const jmcAssignmentSource = new VectorSource();
    jmcAssignmentLookupSourceRef.current = jmcAssignmentSource;
    fetch(resolveDataUrl('data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson'))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load JMC boundaries: ${response.status}`);
        }
        return response.json();
      })
      .then((geojson) => {
        jmcLookupSource.clear();
        jmcLookupSource.addFeatures(
          new GeoJSON().readFeatures(geojson, {
            featureProjection: 'EPSG:3857',
          }),
        );
      })
      .catch((error) => {
        console.error('Failed to load JMC lookup boundaries', error);
      });
    fetch(resolveDataUrl('data/regions/UK_COA3A_Boundaries_Codex_v01_geojson.geojson'))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load COA 3a boundaries: ${response.status}`);
        }
        return response.json();
      })
      .then((geojson) => {
        coa3aBoundaryLookupSource.clear();
        coa3aBoundaryLookupSource.addFeatures(
          new GeoJSON().readFeatures(geojson, {
            featureProjection: 'EPSG:3857',
          }),
        );
      })
      .catch((error) => {
        console.error('Failed to load COA 3a boundary lookup', error);
      });
    fetch(resolveDataUrl('data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load JMC assignments: ${response.status}`);
        }
        return response.json();
      })
      .then((geojson) => {
        jmcAssignmentSource.clear();
        const features = new GeoJSON().readFeatures(geojson, {
          featureProjection: 'EPSG:3857',
        });
        jmcAssignmentSource.addFeatures(features);
        jmcAssignmentByBoundaryNameRef.current = new Map(
          features.flatMap((feature) => {
            const boundaryName = String(feature.get('boundary_name') ?? '').trim();
            const jmcName = getJmcRegionName(feature);
            if (!boundaryName || !jmcName) return [];
            return [[boundaryName, jmcName] as const];
          }),
        );
      })
      .catch((error) => {
        console.error('Failed to load JMC assignment lookup', error);
      });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      basemapRef.current = null;
      regionBoundaryRefs.current.clear();
      regionBoundaryPathRefs.current.clear();
      selectedBoundaryRef.current = null;
      selectedJmcBoundaryRef.current = null;
      selectedPointRef.current = null;
      jmcBoundaryLookupSourceRef.current = null;
      coa3aBoundaryLookupSourceRef.current = null;
      jmcAssignmentLookupSourceRef.current = null;
      jmcAssignmentByBoundaryNameRef.current.clear();
      pointTooltipRootRef.current = null;
      pointTooltipHeaderRef.current = null;
      pointTooltipNameRef.current = null;
      pointTooltipSubnameRef.current = null;
      pointTooltipContextRef.current = null;
      pointTooltipFooterRef.current = null;
      pointTooltipPageRef.current = null;
      pointTooltipPrevRef.current = null;
      pointTooltipNextRef.current = null;
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      selectedBoundaryNameRef.current = null;
      selectedJmcNameRef.current = null;
      layerRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    loadLayers().catch((error) => {
      console.error('Failed to load layers', error);
    });
  }, [loadLayers]);

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

    const byId = new globalThis.Map(regionBoundaryLayers.map((layer) => [layer.id, layer]));

    regionBoundaryLayers.forEach((layerConfig) => {
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
  }, [regionBoundaryLayers, activeViewPreset]);

  useEffect(() => {
    renderPointTooltip();
  }, [facilitySymbolShape, facilitySymbolSize]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedBoundaryLayer = selectedBoundaryRef.current;
    const selectedJmcBoundaryLayer = selectedJmcBoundaryRef.current;
    if (!map || !selectedBoundaryLayer || !selectedJmcBoundaryLayer) return;

    const selectBoundary = (feature: Feature | null, coordinate?: [number, number]) => {
      const selectedSource = selectedBoundaryLayer.getSource();
      const selectedJmcSource = selectedJmcBoundaryLayer.getSource();
      const activeAssignmentSource =
        regionBoundaryRefs.current.get('careBoardBoundaries')?.getSource() ??
        jmcAssignmentLookupSourceRef.current;
      if (!selectedSource) return;
      selectedSource.clear();
      selectedJmcSource?.clear();

      if (!feature) {
        selectedBoundaryNameRef.current = null;
        selectedJmcNameRef.current = null;
        return;
      }

      selectedSource.addFeature(feature.clone());
      selectedBoundaryNameRef.current = getBoundaryName(feature);
      selectedJmcNameRef.current = findJmcNameForBoundarySelection(
        feature,
        coordinate,
        jmcAssignmentByBoundaryNameRef.current,
        activeAssignmentSource,
        jmcBoundaryLookupSourceRef.current,
        activeViewPreset,
      );
    };

    const clickKey: EventsKey = map.on('singleclick', (event) => {
      const visibleRegions = new Map(
        regions.map((region) => [region.name, region]),
      );
      const pointLayers = new Set<VectorLayer<VectorSource>>();
      for (const layer of layers) {
        if (layer.type !== 'point' || !layer.visible) continue;
        const mapLayer = layerRefs.current.get(layer.id);
        if (mapLayer) {
          pointLayers.add(mapLayer);
        }
      }
      const hitFeatures = getDirectPointHitsAtPixel(
        map,
        event.pixel,
        pointLayers,
        visibleRegions,
        facilitySymbolShape,
        facilitySymbolSize,
      );

      if (hitFeatures.length > 0) {
        const clusteredHitFeatures = expandPointHitCluster(
          map,
          hitFeatures,
          pointLayers,
          visibleRegions,
          facilitySymbolShape,
          facilitySymbolSize,
          event.pixel,
        );
        const activeAssignmentSource =
          regionBoundaryRefs.current.get('careBoardBoundaries')?.getSource() ??
          jmcAssignmentLookupSourceRef.current;
        pointTooltipEntriesRef.current = collectPointTooltipEntries(
          clusteredHitFeatures,
          event.coordinate as [number, number],
          regionBoundaryLayers,
          regionBoundaryRefs.current,
          regions,
          activeAssignmentSource,
          activeViewPreset,
        );
        pointTooltipIndexRef.current = 0;
        renderPointTooltip();
        return;
      }

      const selectedFeature = findCareBoardBoundaryAtCoordinate(
        event.coordinate as [number, number],
        regionBoundaryLayers,
        regionBoundaryRefs.current,
      );
      selectBoundary(selectedFeature, event.coordinate as [number, number]);
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      renderPointTooltip();
    });

    return () => {
      unByKey(clickKey);
    };
  }, [regionBoundaryLayers, layers, regions, facilitySymbolSize, activeViewPreset]);

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
        ),
      });

      map.addLayer(vectorLayer);
      layerRefs.current.set(layer.id, vectorLayer);
      return vectorLayer;
    };

    layers.forEach((layer) => {
      const vectorLayer = getVectorLayer(layer);
      vectorLayer.setStyle(
        getStyleForLayer(layer, regionByName, facilitySymbolShape, facilitySymbolSize),
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
  }, [layers, regions, facilitySymbolShape, facilitySymbolSize]);

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
  layerConfig: RegionBoundaryLayerStyle,
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
  layer: RegionBoundaryLayerStyle,
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
  layer: RegionBoundaryLayerStyle,
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
  layer: RegionBoundaryLayerStyle,
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

function getUsesPerFeatureBoundaryColor(layer: RegionBoundaryLayerStyle): boolean {
  return (
    layer.path.includes('UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson')
  );
}

function getFeatureBoundaryLineColor(
  layer: RegionBoundaryLayerStyle,
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
  layer: RegionBoundaryLayerStyle,
  feature: FeatureLike,
): number {
  if (!layer.borderVisible) return 0;
  if (
    isCoa3aLondonDistrictOverlay(layer, feature) ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson')
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
  layer: RegionBoundaryLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) !== 'London District'
  );
}

function isCoa3aLondonDistrictOverlay(
  layer: RegionBoundaryLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) === 'London District'
  );
}

function isCoa3aLondonDistrictOverlayLayer(layer: RegionBoundaryLayerStyle): boolean {
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
  const regionName = getScenarioJmcName(feature, activeViewPreset);
  if (!regionName) return null;

  const byRegionName: Record<string, string> = {
    'COA 3a Devolved Administrations': '#cbd4dd',
    'COA 3a North': '#dee8c3',
    'COA 3a Midlands': '#ebcfc7',
    'COA 3a South West': '#149ece',
    'COA 3a South East': '#cadec2',
    'JMC Scotland': '#4862b8',
    'JMC Northern Ireland': '#4862b8',
    'JMC Wales': '#4862b8',
    'JMC North': '#a7c636',
    'JMC Centre': '#ed5151',
    'JMC South West': '#149ece',
    'JMC South East': '#419632',
    'London District': '#419632',
  };

  const populatedByRegionName: Record<string, string> = {
    'COA 3a Devolved Administrations': '#bbc5d8',
    'COA 3a North': '#d7e3b1',
    'COA 3a Midlands': '#ecc0b9',
    'COA 3a South West': '#abd7df',
    'COA 3a South East': '#b8d5b0',
    'JMC Scotland': '#4862b8',
    'JMC Northern Ireland': '#4862b8',
    'JMC Wales': '#4862b8',
    'JMC North': '#a7c636',
    'JMC Centre': '#ed5151',
    'JMC South West': '#149ece',
    'JMC South East': '#419632',
    'London District': '#419632',
  };

  const baseColor = byRegionName[regionName];
  if (!baseColor) return null;

  return feature.get('is_populated')
    ? populatedByRegionName[regionName] ?? baseColor
    : baseColor;
}

function getSelectedJmcOutlineColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const regionName = getScenarioJmcName(feature, activeViewPreset);
  if (!regionName) return null;

  const byRegionName: Record<string, string> = {
    'COA 3a Devolved Administrations': '#4862b8',
    'COA 3a North': '#a7c636',
    'COA 3a Midlands': '#ed5151',
    'COA 3a South West': '#149ece',
    'COA 3a South East': '#419632',
    'JMC Scotland': '#4862b8',
    'JMC Northern Ireland': '#4862b8',
    'JMC Wales': '#4862b8',
    'JMC North': '#a7c636',
    'JMC Centre': '#ed5151',
    'JMC South West': '#149ece',
    'JMC South East': '#419632',
    'London District': '#419632',
  };

  return byRegionName[regionName] ?? null;
}

function getScenarioJmcName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string {
  const regionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();

  if (activeViewPreset !== 'coa3b') {
    return regionName;
  }

  if (
    regionName === 'JMC Scotland' ||
    regionName === 'JMC Northern Ireland' ||
    regionName === 'JMC Wales'
  ) {
    return 'COA 3a Devolved Administrations';
  }

  if (regionName === 'JMC North') {
    return 'COA 3a North';
  }

  if (regionName === 'JMC Centre') {
    return 'COA 3a Midlands';
  }

  if (regionName === 'JMC South West') {
    return 'COA 3a South West';
  }

  if (
    regionName === 'JMC South East' ||
    regionName === 'London District' ||
    boundaryName === 'NHS Essex Integrated Care Board' ||
    boundaryName === 'NHS Central East Integrated Care Board' ||
    boundaryName === 'NHS Norfolk and Suffolk Integrated Care Board'
  ) {
    return 'COA 3a South East';
  }

  return regionName;
}

function getRegionBoundaryLayerZIndex(layer: RegionBoundaryLayerStyle): number {
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

function findCareBoardBoundaryAtCoordinate(
  coordinate: [number, number],
  regionBoundaryLayers: RegionBoundaryLayerStyle[],
  regionBoundaryRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): Feature | null {
  for (const config of regionBoundaryLayers) {
    if (config.id !== 'careBoardBoundaries') continue;
    if (!config.visible) continue;
    const layer = regionBoundaryRefs.get(config.id);
    const source = layer?.getSource();
    if (!source) continue;
    const hit = source
      .getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate));
    if (hit) {
      return hit;
    }
  }

  return null;
}

function getDirectPointHitsAtPixel(
  map: OLMap,
  pixel: number[],
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): FeatureLike[] {
  const hits = map.getFeaturesAtPixel(pixel, {
    hitTolerance: 0,
    layerFilter: (layerCandidate) =>
      pointLayers.has(layerCandidate as VectorLayer<VectorSource>),
  });

  return hits.filter((feature) => {
    const coordinate = getPointCoordinate(feature);
    if (!coordinate) return false;
    const featurePixel = map.getPixelFromCoordinate(coordinate);
    const dx = featurePixel[0] - pixel[0];
    const dy = featurePixel[1] - pixel[1];
    const distance = Math.hypot(dx, dy);
    const radius = getPointSelectionRadius(
      feature,
      regionsByName,
      facilitySymbolShape,
      facilitySymbolSize,
    );
    return distance <= radius + 0.75;
  });
}

function expandPointHitCluster(
  map: OLMap,
  seedFeatures: FeatureLike[],
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
  clickPixel: number[],
): FeatureLike[] {
  const candidates = collectVisiblePointCandidates(
    map,
    pointLayers,
    regionsByName,
    facilitySymbolShape,
    facilitySymbolSize,
  );
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const seeds: PointSelectionCandidate[] = [];
  const selected = new Set<string>();

  for (const feature of seedFeatures) {
    const candidate = getPointSelectionCandidate(
      map,
      feature,
      regionsByName,
      facilitySymbolShape,
      facilitySymbolSize,
    );
    if (!candidate || selected.has(candidate.key)) continue;
    seeds.push(candidate);
    selected.add(candidate.key);
  }

  for (const candidate of candidates) {
    if (selected.has(candidate.key)) continue;
    if (seeds.some((seed) => pointCandidatesOverlap(seed, candidate))) {
      selected.add(candidate.key);
    }
  }

  return [...selected]
    .map((key) => candidatesByKey.get(key))
    .filter((candidate): candidate is PointSelectionCandidate => candidate !== undefined)
    .map((candidate) => candidate.feature)
    .sort((a, b) => {
      const aCoordinate = getPointCoordinate(a);
      const bCoordinate = getPointCoordinate(b);
      if (aCoordinate && bCoordinate) {
        const aPixel = map.getPixelFromCoordinate(aCoordinate);
        const bPixel = map.getPixelFromCoordinate(bCoordinate);
        const aDistance = Math.hypot(
          aPixel[0] - clickPixel[0],
          aPixel[1] - clickPixel[1],
        );
        const bDistance = Math.hypot(
          bPixel[0] - clickPixel[0],
          bPixel[1] - clickPixel[1],
        );
        if (aDistance !== bDistance) {
          return aDistance - bDistance;
        }
      }

      const aName = String(a.get('name') ?? '');
      const bName = String(b.get('name') ?? '');
      return aName.localeCompare(bName);
    });
}

interface PointSelectionCandidate {
  key: string;
  feature: FeatureLike;
  pixel: [number, number];
  radius: number;
}

function collectVisiblePointCandidates(
  map: OLMap,
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): PointSelectionCandidate[] {
  const candidates: PointSelectionCandidate[] = [];

  for (const layer of pointLayers) {
    const source = layer.getSource();
    if (!source) continue;

    for (const feature of source.getFeatures()) {
      if (!isPointFeatureSelectable(feature, regionsByName)) continue;
      const candidate = getPointSelectionCandidate(
        map,
        feature,
        regionsByName,
        facilitySymbolShape,
        facilitySymbolSize,
      );
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function getPointSelectionCandidate(
  map: OLMap,
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): PointSelectionCandidate | null {
  const coordinate = getPointCoordinate(feature);
  if (!coordinate) return null;

  const name = String(feature.get('name') ?? '').trim();
  const pixel = map.getPixelFromCoordinate(coordinate);
  const radius = getPointSelectionRadius(
    feature,
    regionsByName,
    facilitySymbolShape,
    facilitySymbolSize,
  );

  return {
    key: `${name}:${coordinate[0].toFixed(6)}:${coordinate[1].toFixed(6)}`,
    feature,
    pixel: [pixel[0], pixel[1]],
    radius,
  };
}

function isPointFeatureSelectable(
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
): boolean {
  const regionName = String(feature.get('region') ?? 'Unassigned');
  const regionStyle = regionsByName.get(regionName);
  const defaultVisible = Number(feature.get('default_visible') ?? 1) !== 0;

  if (regionStyle) {
    return regionStyle.visible;
  }

  return defaultVisible;
}

function getPointSelectionRadius(
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): number {
  const regionName = String(feature.get('region') ?? 'Unassigned');
  const regionStyle = regionsByName.get(regionName);
  const symbolSize = regionStyle?.symbolSize ?? facilitySymbolSize;
  const borderVisible = regionStyle?.borderVisible ?? true;
  const borderOpacity = regionStyle?.borderOpacity ?? 1;
  const borderWidth = borderVisible && borderOpacity > 0.01 ? 1 : 0;
  const shape = facilitySymbolShape;

  return getRenderedPointPixelRadius(shape, symbolSize, borderWidth);
}

function pointCandidatesOverlap(
  a: PointSelectionCandidate,
  b: PointSelectionCandidate,
): boolean {
  const dx = a.pixel[0] - b.pixel[0];
  const dy = a.pixel[1] - b.pixel[1];
  const distance = Math.hypot(dx, dy);
  return distance <= a.radius + b.radius + 0.75;
}

function getRenderedPointPixelRadius(
  shape: FacilitySymbolShape,
  size: number,
  borderWidth: number,
): number {
  if (shape === 'circle') {
    return size + borderWidth;
  }

  if (shape === 'square' || shape === 'diamond') {
    return size * 1.05 + borderWidth;
  }

  return size * 1.15 + borderWidth;
}

function getBoundaryName(feature: Feature): string {
  const value =
    feature.get('region_name') ??
    feature.get('region_ref') ??
    feature.get('boundary_name') ??
    feature.get('parent_name') ??
    feature.get('name') ??
    feature.get('NAME') ??
    feature.get('component_name');
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Boundary';
  }
  return String(value);
}

function collectPointTooltipEntries(
  features: FeatureLike[],
  fallbackCoordinate: [number, number],
  regionBoundaryLayers: RegionBoundaryLayerStyle[],
  regionBoundaryRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
  regions: RegionStyle[],
  jmcAssignmentLookupSource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): PointTooltipEntry[] {
  const entries: PointTooltipEntry[] = [];
  const seen = new Set<string>();
  const regionsByName = new Map(regions.map((region) => [region.name, region]));

  for (const feature of features) {
    const rawName = feature.get('name');
    if (rawName === undefined || rawName === null) continue;
    const name = String(rawName).trim();
    if (!name) continue;

    const coordinate = getPointCoordinate(feature) ?? fallbackCoordinate;
    const boundaryFeature = findCareBoardBoundaryAtCoordinate(
      coordinate,
      regionBoundaryLayers,
      regionBoundaryRefs,
    );
    const boundaryName = boundaryFeature ? getBoundaryName(boundaryFeature) : null;
    const jmcName = findJmcNameAtCoordinate(
      coordinate,
      jmcAssignmentLookupSource,
      null,
      activeViewPreset,
    );
    const regionName = String(feature.get('region') ?? 'Unassigned');
    const regionStyle = regionsByName.get(regionName);
    const hasVisibleBorder =
      (regionStyle?.borderVisible ?? true) &&
      (regionStyle?.borderOpacity ?? 1) > 0.01;
    const symbolSize = regionStyle?.symbolSize ?? 3.5;
    const key = `${name}:${coordinate[0].toFixed(3)}:${coordinate[1].toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      facilityName: name,
      coordinate,
      boundaryName,
      hasVisibleBorder,
      symbolSize,
      jmcName,
    });
  }

  return entries;
}

function getPointCoordinate(feature: FeatureLike): [number, number] | null {
  if (typeof (feature as Feature).getGeometry === 'function') {
    const geometry = (feature as Feature).getGeometry();
    if (
      geometry &&
      geometry.getType() === 'Point' &&
      typeof
        (geometry as unknown as { getCoordinates?: () => number[] })
          .getCoordinates === 'function'
    ) {
      const coordinates = (
        geometry as unknown as { getCoordinates: () => number[] }
      ).getCoordinates();
      if (coordinates.length >= 2) {
        return [coordinates[0], coordinates[1]];
      }
    }
  }

  const renderFeature = feature as unknown as {
    getType?: () => string;
    getFlatCoordinates?: () => number[];
  };
  if (
    typeof renderFeature.getType === 'function' &&
    renderFeature.getType() === 'Point' &&
    typeof renderFeature.getFlatCoordinates === 'function'
  ) {
    const flatCoordinates = renderFeature.getFlatCoordinates();
    if (flatCoordinates.length >= 2) {
      return [flatCoordinates[0], flatCoordinates[1]];
    }
  }

  return null;
}

function resolveDataUrl(path: string): string {
  return new URL(path, window.location.origin + import.meta.env.BASE_URL).toString();
}

function findJmcBoundaryAtCoordinate(
  coordinate: [number, number],
  source: VectorSource | null,
): Feature | null {
  if (!source) return null;

  return (
    source
      .getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate)) ?? null
  );
}

function findJmcNameAtCoordinate(
  coordinate: [number, number],
  assignmentSource: VectorSource | null,
  boundarySource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string | null {
  const assignmentFeature =
    assignmentSource
      ?.getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate)) ?? null;
  if (assignmentFeature) {
    const jmcName = getScenarioJmcName(assignmentFeature, activeViewPreset);
    return jmcName || null;
  }

  const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, boundarySource);
  if (!boundaryFeature) return null;

  const jmcName = getScenarioJmcName(boundaryFeature, activeViewPreset);
  return jmcName || null;
}

function findJmcNameForBoundarySelection(
  feature: Feature,
  coordinate: [number, number] | undefined,
  assignmentByBoundaryName: Map<string, string>,
  assignmentSource: VectorSource | null,
  boundarySource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string | null {
  const directJmcName = getScenarioJmcName(feature, activeViewPreset);
  if (directJmcName) {
    return directJmcName;
  }

  const boundaryName = getBoundaryName(feature);
  const mappedJmcName = assignmentByBoundaryName.get(boundaryName);
  if (mappedJmcName) {
    return getScenarioJmcName(
      new Feature({
        boundary_name: boundaryName,
        jmc_name: mappedJmcName,
      }),
      activeViewPreset,
    );
  }

  if (!coordinate) {
    return null;
  }

  return findJmcNameAtCoordinate(
    coordinate,
    assignmentSource,
    boundarySource,
    activeViewPreset,
  );
}

function getSelectedJmcOutlineFeatures(
  coordinate: [number, number],
  jmcName: string | null,
  activeViewPreset: ViewPresetId,
  scenarioBoundarySource: VectorSource | null,
  boundarySource: VectorSource | null,
): Feature[] {
  if (activeViewPreset === 'coa3b' && scenarioBoundarySource) {
    if (jmcName) {
      const matchedFeatures = scenarioBoundarySource
        .getFeatures()
        .filter((feature) => getScenarioJmcName(feature, activeViewPreset) === jmcName);
      if (matchedFeatures.length > 0) {
        return matchedFeatures;
      }
    }

    const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, scenarioBoundarySource);
    return boundaryFeature ? [boundaryFeature] : [];
  }

  const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, boundarySource);
  return boundaryFeature ? [boundaryFeature] : [];
}

function getStyleForLayer(
  layer: LayerState,
  regions: Map<string, RegionStyle>,
  symbolShape: FacilitySymbolShape,
  symbolSize: number,
) {
  if (layer.type === 'point') {
    const cache = new Map<string, Style>();
    return (feature: FeatureLike) => {
      const regionName = String(feature.get('region') ?? 'Unassigned');
      const regionStyle = regions.get(regionName);
      const defaultVisible = Number(feature.get('default_visible') ?? 1) !== 0;
      if ((regionStyle && !regionStyle.visible) || (!regionStyle && !defaultVisible)) {
        return undefined;
      }

      const hex =
        regionStyle?.color ??
        ((feature.get('point_color_hex') as string | undefined) ?? '#0066cc');
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
