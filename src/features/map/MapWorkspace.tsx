import { useEffect, useRef } from 'react';
import OLMap from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
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
  const selectedBoundaryRef = useRef<VectorLayer<VectorSource> | null>(null);
  const tooltipOverlayRef = useRef<Overlay | null>(null);
  const tooltipElementRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map(),
  );

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

    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'map-tooltip map-tooltip--hidden';
    tooltipElementRef.current = tooltipElement;
    const tooltipOverlay = new Overlay({
      element: tooltipElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });
    tooltipOverlayRef.current = tooltipOverlay;
    mapRef.current.addOverlay(tooltipOverlay);

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      basemapRef.current = null;
      regionBoundaryRefs.current.clear();
      selectedBoundaryRef.current = null;
      tooltipOverlayRef.current = null;
      tooltipElementRef.current = null;
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
      boundaryLayer.setSource(
        new VectorSource({
          url: sourceUrl,
          format: new GeoJSON(),
        }),
      );
      boundaryLayer.setVisible(layerConfig.visible);
      boundaryLayer.setStyle(createRegionBoundaryStyle(layerConfig));
    });

    regionBoundaryRefs.current.forEach((layerRef, id) => {
      if (byId.has(id)) return;
      map.removeLayer(layerRef);
      regionBoundaryRefs.current.delete(id);
    });
  }, [regionBoundaryLayers]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedBoundaryLayer = selectedBoundaryRef.current;
    const tooltipOverlay = tooltipOverlayRef.current;
    const tooltipElement = tooltipElementRef.current;
    if (!map || !selectedBoundaryLayer || !tooltipOverlay || !tooltipElement) return;

    const selectBoundary = (feature: Feature | null, coordinate?: number[]) => {
      const selectedSource = selectedBoundaryLayer.getSource();
      if (!selectedSource) return;
      selectedSource.clear();

      if (!feature || !coordinate) {
        tooltipElement.textContent = '';
        tooltipElement.classList.add('map-tooltip--hidden');
        tooltipOverlay.setPosition(undefined);
        return;
      }

      selectedSource.addFeature(feature.clone());
      tooltipElement.textContent = getBoundaryName(feature);
      tooltipElement.classList.remove('map-tooltip--hidden');
      tooltipOverlay.setPosition(coordinate);
    };

    const clickKey: EventsKey = map.on('singleclick', (event) => {
      let selectedFeature: Feature | null = null;

      for (const config of regionBoundaryLayers) {
        if (config.id !== 'careBoardBoundaries') continue;
        if (!config.visible) continue;
        const layer = regionBoundaryRefs.current.get(config.id);
        const source = layer?.getSource();
        if (!source) continue;
        const hit = source
          .getFeatures()
          .find((feature) =>
            feature.getGeometry()?.intersectsCoordinate(event.coordinate),
          );
        if (hit) {
          selectedFeature = hit;
          break;
        }
      }

      selectBoundary(selectedFeature, event.coordinate);
    });

    return () => {
      unByKey(clickKey);
    };
  }, [regionBoundaryLayers]);

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
    zIndex: -5,
  });
}

function createSelectedBoundaryLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: '#facc15',
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0)',
      }),
    }),
    zIndex: 30,
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
  layers.majorCities.setSource(
    new VectorSource({
      url: urls.populatedPlaces,
      format: new GeoJSON(),
    }),
  );
  layers.seaLabels.setSource(
    new VectorSource({
      url: urls.marineLabels,
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
      'data/basemaps/ne_10m_geography_marine_polys.geojson',
      baseUrl,
    ).toString(),
    populatedPlaces: new URL(
      'data/basemaps/ne_10m_populated_places.geojson',
      baseUrl,
    ).toString(),
  };
}

function createFillStyle(color: string) {
  return new Style({
    fill: new Fill({
      color,
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
  return (feature: FeatureLike) => {
    const name = feature.get('NAME_LONG') ?? feature.get('NAME');
    if (!name) return undefined;
    return new Style({
      text: new TextStyle({
        text: String(name),
        font: '12px Manrope, sans-serif',
        fill: new Fill({
          color: withOpacity(
            basemap?.countryLabelColor ?? '#0f172a',
            basemap?.countryLabelOpacity ?? 1,
          ),
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
  };
}

function createMajorCityStyle(basemap?: BasemapSettings) {
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

    return new Style({
      image: new CircleStyle({
        radius: isCapital ? 3 : 2.5,
        fill: new Fill({
          color: withOpacity(
            basemap?.majorCityColor ?? '#1f2937',
            basemap?.majorCityOpacity ?? 1,
          ),
        }),
        stroke: new Stroke({ color: '#ffffff', width: 1 }),
      }),
      text: new TextStyle({
        text: String(name),
        font: '11px Manrope, sans-serif',
        offsetY: -10,
        fill: new Fill({
          color: withOpacity(
            basemap?.majorCityColor ?? '#1f2937',
            basemap?.majorCityOpacity ?? 1,
          ),
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
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
  return (feature: FeatureLike) => {
    const name = feature.get('name_en') ?? feature.get('name');
    if (!name) return undefined;
    return new Style({
      text: new TextStyle({
        text: String(name),
        font: 'italic 11px Manrope, sans-serif',
        fill: new Fill({
          color: withOpacity(
            basemap?.seaLabelColor ?? '#334155',
            basemap?.seaLabelOpacity ?? 1,
          ),
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 3,
        }),
      }),
    });
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
  return (feature: FeatureLike) => {
    const rawColor = String(feature.get('fill_color_hex') ?? 'ed5151').replace('#', '');
    const baseColor = /^([0-9a-fA-F]{6})$/.test(rawColor)
      ? `#${rawColor}`
      : layer.swatchColor;
    const fillOpacity = layer.opacity;

    return new Style({
      stroke: new Stroke({
        color: withOpacity(layer.borderColor, layer.borderOpacity),
        width: layer.borderVisible ? 1 : 0,
      }),
      fill: new Fill({
        color: withOpacity(baseColor, fillOpacity),
      }),
    });
  };
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
      const key = `${hex}:${opacity}:${borderVisible}:${borderColor}:${borderOpacity}:${symbolShape}:${symbolSize}`;
      const existing = cache.get(key);
      if (existing) {
        return existing;
      }

      const style = new Style({
        image: createPointSymbol(
          symbolShape,
          symbolSize,
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
