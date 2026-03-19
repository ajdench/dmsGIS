import { describe, expect, it, vi } from 'vitest';
import { getViewportFromMap, syncViewportToMap } from '../src/features/map/viewportSync';

describe('viewportSync', () => {
  it('applies changed viewport state to the map view only when needed', () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    const setRotation = vi.fn();
    const map = {
      getView() {
        return {
          getCenter: () => [0, 0],
          getZoom: () => 5,
          getRotation: () => 0,
          setCenter,
          setZoom,
          setRotation,
        };
      },
    };

    syncViewportToMap(map as never, {
      center: [10, 20],
      zoom: 6,
      rotation: 0.5,
    });

    expect(setCenter).toHaveBeenCalledWith([10, 20]);
    expect(setZoom).toHaveBeenCalledWith(6);
    expect(setRotation).toHaveBeenCalledWith(0.5);
  });

  it('reads viewport state back from the map view', () => {
    const map = {
      getView() {
        return {
          getCenter: () => [100, 200],
          getZoom: () => 7.25,
          getRotation: () => 0.1,
        };
      },
    };

    expect(getViewportFromMap(map as never)).toEqual({
      center: [100, 200],
      zoom: 7.25,
      rotation: 0.1,
    });
  });
});
