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
}

export function MapWorkspace() {
  const layers = useAppStore((state) => state.layers);
  const regions = useAppStore((state) => state.regions);
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
  const selectedPointRef = useRef<VectorLayer<VectorSource> | null>(null);
  const pointTooltipRootRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipHeaderRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipNameRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipContextRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipFooterRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipPageRef = useRef<HTMLSpanElement | null>(null);
  const pointTooltipPrevRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipNextRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipEntriesRef = useRef<PointTooltipEntry[]>([]);
  const pointTooltipIndexRef = useRef(0);
  const selectedBoundaryNameRef = useRef<string | null>(null);
  const layerRefs = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map(),
  );

  const renderPointTooltip = () => {
    const root = pointTooltipRootRef.current;
    const header = pointTooltipHeaderRef.current;
    const name = pointTooltipNameRef.current;
    const context = pointTooltipContextRef.current;
    const footer = pointTooltipFooterRef.current;
    const page = pointTooltipPageRef.current;
    const prev = pointTooltipPrevRef.current;
    const next = pointTooltipNextRef.current;
    if (!root || !header || !name || !context || !footer || !page || !prev || !next) {
      return;
    }

    const entries = pointTooltipEntriesRef.current;
    const selectedPointSource = selectedPointRef.current?.getSource();
    const selectedPointLayer = selectedPointRef.current;
    if (entries.length === 0) {
      const boundaryName = selectedBoundaryNameRef.current;
      if (!boundaryName) {
        name.textContent = '';
        context.textContent = '';
        page.textContent = '';
        prev.disabled = true;
        next.disabled = true;
        footer.classList.add('map-tooltip-card__footer--hidden');
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
        return;
      }

      name.textContent = boundaryName;
      context.textContent = '';
      page.textContent = '';
      prev.disabled = true;
      next.disabled = true;
      footer.classList.add('map-tooltip-card__footer--hidden');
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
      return;
    }

    const index = Math.max(
      0,
      Math.min(pointTooltipIndexRef.current, entries.length - 1),
    );
    pointTooltipIndexRef.current = index;
    const current = entries[index];
    name.textContent = current.facilityName;
    page.textContent = `Page ${index + 1} of ${entries.length}`;
    context.textContent = current.boundaryName ?? '';
    prev.disabled = index === 0;
    next.disabled = index >= entries.length - 1;
    footer.classList.remove('map-tooltip-card__footer--hidden');
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
      } else {
        selectedBoundaryNameRef.current = null;
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
    const selectedPointLayer = createSelectedPointLayer();
    selectedPointRef.current = selectedPointLayer;
    mapRef.current.addLayer(selectedPointLayer);

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      basemapRef.current = null;
      regionBoundaryRefs.current.clear();
      regionBoundaryPathRefs.current.clear();
      selectedBoundaryRef.current = null;
      selectedPointRef.current = null;
      pointTooltipRootRef.current = null;
      pointTooltipHeaderRef.current = null;
      pointTooltipNameRef.current = null;
      pointTooltipContextRef.current = null;
      pointTooltipFooterRef.current = null;
      pointTooltipPageRef.current = null;
      pointTooltipPrevRef.current = null;
      pointTooltipNextRef.current = null;
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      selectedBoundaryNameRef.current = null;
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
        boundaryLayer = createRegionBoundaryLayer(layerConfig);
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
      boundaryLayer.setStyle(createRegionBoundaryStyle(layerConfig));
    });

    regionBoundaryRefs.current.forEach((layerRef, id) => {
      if (byId.has(id)) return;
      map.removeLayer(layerRef);
      regionBoundaryRefs.current.delete(id);
      regionBoundaryPathRefs.current.delete(id);
    });
  }, [regionBoundaryLayers]);

  useEffect(() => {
    renderPointTooltip();
  }, [facilitySymbolShape, facilitySymbolSize]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedBoundaryLayer = selectedBoundaryRef.current;
    if (!map || !selectedBoundaryLayer) return;

    const selectBoundary = (feature: Feature | null) => {
      const selectedSource = selectedBoundaryLayer.getSource();
      if (!selectedSource) return;
      selectedSource.clear();

      if (!feature) {
        selectedBoundaryNameRef.current = null;
        return;
      }

      selectedSource.addFeature(feature.clone());
      selectedBoundaryNameRef.current = getBoundaryName(feature);
    };

    const clickKey: EventsKey = map.on('singleclick', (event) => {
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
        facilitySymbolSize,
      );

      if (hitFeatures.length > 0) {
        pointTooltipEntriesRef.current = collectPointTooltipEntries(
          hitFeatures,
          event.coordinate as [number, number],
          regionBoundaryLayers,
          regionBoundaryRefs.current,
          regions,
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
      selectBoundary(selectedFeature);
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      renderPointTooltip();
    });

    return () => {
      unByKey(clickKey);
    };
  }, [regionBoundaryLayers, layers, regions, facilitySymbolSize]);

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
        </div>
        <div className="map-canvas" ref={ref} />
      </div>
    </main>
  );
}

function createRegionBoundaryLayer(
  layerConfig: RegionBoundaryLayerStyle,
): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: createRegionBoundaryStyle(layerConfig),
    zIndex: getRegionBoundaryLayerZIndex(layerConfig.id),
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

function createRegionBoundaryStyle(layer: RegionBoundaryLayerStyle) {
  const strokeColor = withOpacity(layer.borderColor, layer.borderOpacity);
  const strokeWidth = layer.borderVisible ? 1 : 0;
  const fillOpacity = layer.opacity;
  const cache = new Map<string, Style>();

  return (feature: FeatureLike) => {
    const rawColor = String(feature.get('fill_color_hex') ?? 'ed5151').replace('#', '');
    const baseColor = /^([0-9a-fA-F]{6})$/.test(rawColor)
      ? `#${rawColor}`
      : layer.swatchColor;
    const existing = cache.get(baseColor);
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
    cache.set(baseColor, style);
    return style;
  };
}

function getRegionBoundaryLayerZIndex(layerId: string): number {
  if (layerId === 'pmcUnpopulatedCareBoardBoundaries') {
    return 4;
  }
  if (layerId === 'pmcPopulatedCareBoardBoundaries') {
    return 5;
  }
  if (layerId === 'careBoardBoundaries') {
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
    return distance <= Math.max(5, facilitySymbolSize + 2);
  });
}

function getBoundaryName(feature: Feature): string {
  const value =
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
