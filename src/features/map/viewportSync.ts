import type OLMap from 'ol/Map';
import type { MapViewportState } from '../../lib/schemas/savedViews';

export function syncViewportToMap(
  map: OLMap,
  mapViewport: MapViewportState,
): void {
  const view = map.getView();
  const currentCenter = view.getCenter() as [number, number] | undefined;
  const nextCenter = mapViewport.center;
  const currentZoom = view.getZoom() ?? 0;
  const currentRotation = view.getRotation() ?? 0;

  const centerChanged =
    !currentCenter ||
    Math.abs(currentCenter[0] - nextCenter[0]) > 0.001 ||
    Math.abs(currentCenter[1] - nextCenter[1]) > 0.001;
  const zoomChanged = Math.abs(currentZoom - mapViewport.zoom) > 0.001;
  const rotationChanged = Math.abs(currentRotation - mapViewport.rotation) > 0.001;

  if (centerChanged) {
    view.setCenter(nextCenter);
  }
  if (zoomChanged) {
    view.setZoom(mapViewport.zoom);
  }
  if (rotationChanged) {
    view.setRotation(mapViewport.rotation);
  }
}

export function getViewportFromMap(
  map: OLMap,
): MapViewportState {
  const view = map.getView();
  return {
    center: (view.getCenter() as [number, number]) ?? [0, 0],
    zoom: view.getZoom() ?? 0,
    rotation: view.getRotation() ?? 0,
  };
}
