import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
} from 'ol/style';
import type { FacilitySymbolShape } from '../../types';

export function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function createPointSymbol(
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
