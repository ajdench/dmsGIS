import {
  createEmpty,
  extendFlatCoordinates,
  forEachCorner,
  intersects,
  intersectsSegment
} from "./chunk-X4UNTAV4.js";
import {
  lerp,
  squaredDistance,
  squaredSegmentDistance
} from "./chunk-64CD5QBF.js";

// node_modules/ol/geom/flat/inflate.js
function inflateCoordinates(flatCoordinates, offset, end, stride, coordinates) {
  coordinates = coordinates !== void 0 ? coordinates : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    coordinates[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates.length = i;
  return coordinates;
}
function inflateCoordinatesArray(flatCoordinates, offset, ends, stride, coordinatess) {
  coordinatess = coordinatess !== void 0 ? coordinatess : [];
  let i = 0;
  for (let j = 0, jj = ends.length; j < jj; ++j) {
    const end = ends[j];
    coordinatess[i++] = inflateCoordinates(
      flatCoordinates,
      offset,
      end,
      stride,
      coordinatess[i]
    );
    offset = end;
  }
  coordinatess.length = i;
  return coordinatess;
}
function inflateMultiCoordinatesArray(flatCoordinates, offset, endss, stride, coordinatesss) {
  coordinatesss = coordinatesss !== void 0 ? coordinatesss : [];
  let i = 0;
  for (let j = 0, jj = endss.length; j < jj; ++j) {
    const ends = endss[j];
    coordinatesss[i++] = ends.length === 1 && ends[0] === offset ? [] : inflateCoordinatesArray(
      flatCoordinates,
      offset,
      ends,
      stride,
      coordinatesss[i]
    );
    offset = ends[ends.length - 1];
  }
  coordinatesss.length = i;
  return coordinatesss;
}

// node_modules/ol/geom/flat/simplify.js
function douglasPeucker(flatCoordinates, offset, end, stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  const n = (end - offset) / stride;
  if (n < 3) {
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  const markers = new Array(n);
  markers[0] = 1;
  markers[n - 1] = 1;
  const stack = [offset, end - stride];
  let index = 0;
  while (stack.length > 0) {
    const last = stack.pop();
    const first = stack.pop();
    let maxSquaredDistance = 0;
    const x1 = flatCoordinates[first];
    const y1 = flatCoordinates[first + 1];
    const x2 = flatCoordinates[last];
    const y2 = flatCoordinates[last + 1];
    for (let i = first + stride; i < last; i += stride) {
      const x = flatCoordinates[i];
      const y = flatCoordinates[i + 1];
      const squaredDistance2 = squaredSegmentDistance(x, y, x1, y1, x2, y2);
      if (squaredDistance2 > maxSquaredDistance) {
        index = i;
        maxSquaredDistance = squaredDistance2;
      }
    }
    if (maxSquaredDistance > squaredTolerance) {
      markers[(index - offset) / stride] = 1;
      if (first + stride < index) {
        stack.push(first, index);
      }
      if (index + stride < last) {
        stack.push(index, last);
      }
    }
  }
  for (let i = 0; i < n; ++i) {
    if (markers[i]) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride];
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride + 1];
    }
  }
  return simplifiedOffset;
}
function douglasPeuckerArray(flatCoordinates, offset, ends, stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    simplifiedOffset = douglasPeucker(
      flatCoordinates,
      offset,
      end,
      stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset
    );
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}
function snap(value, tolerance) {
  return tolerance * Math.round(value / tolerance);
}
function quantize(flatCoordinates, offset, end, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  if (offset == end) {
    return simplifiedOffset;
  }
  let x1 = snap(flatCoordinates[offset], tolerance);
  let y1 = snap(flatCoordinates[offset + 1], tolerance);
  offset += stride;
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  let x2, y2;
  do {
    x2 = snap(flatCoordinates[offset], tolerance);
    y2 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (offset == end) {
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      return simplifiedOffset;
    }
  } while (x2 == x1 && y2 == y1);
  while (offset < end) {
    const x3 = snap(flatCoordinates[offset], tolerance);
    const y3 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (x3 == x2 && y3 == y2) {
      continue;
    }
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const dx2 = x3 - x1;
    const dy2 = y3 - y1;
    if (dx1 * dy2 == dy1 * dx2 && (dx1 < 0 && dx2 < dx1 || dx1 == dx2 || dx1 > 0 && dx2 > dx1) && (dy1 < 0 && dy2 < dy1 || dy1 == dy2 || dy1 > 0 && dy2 > dy1)) {
      x2 = x3;
      y2 = y3;
      continue;
    }
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
    x1 = x2;
    y1 = y2;
    x2 = x3;
    y2 = y3;
  }
  simplifiedFlatCoordinates[simplifiedOffset++] = x2;
  simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  return simplifiedOffset;
}
function quantizeArray(flatCoordinates, offset, ends, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    simplifiedOffset = quantize(
      flatCoordinates,
      offset,
      end,
      stride,
      tolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset
    );
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}
function quantizeMultiArray(flatCoordinates, offset, endss, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset, simplifiedEndss) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    const simplifiedEnds = [];
    simplifiedOffset = quantizeArray(
      flatCoordinates,
      offset,
      ends,
      stride,
      tolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset,
      simplifiedEnds
    );
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
}

// node_modules/ol/geom/flat/closest.js
function assignClosest(flatCoordinates, offset1, offset2, stride, x, y, closestPoint) {
  const x1 = flatCoordinates[offset1];
  const y1 = flatCoordinates[offset1 + 1];
  const dx = flatCoordinates[offset2] - x1;
  const dy = flatCoordinates[offset2 + 1] - y1;
  let offset;
  if (dx === 0 && dy === 0) {
    offset = offset1;
  } else {
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      offset = offset2;
    } else if (t > 0) {
      for (let i = 0; i < stride; ++i) {
        closestPoint[i] = lerp(
          flatCoordinates[offset1 + i],
          flatCoordinates[offset2 + i],
          t
        );
      }
      closestPoint.length = stride;
      return;
    } else {
      offset = offset1;
    }
  }
  for (let i = 0; i < stride; ++i) {
    closestPoint[i] = flatCoordinates[offset + i];
  }
  closestPoint.length = stride;
}
function maxSquaredDelta(flatCoordinates, offset, end, stride, max) {
  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  for (offset += stride; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    const squaredDelta = squaredDistance(x1, y1, x2, y2);
    if (squaredDelta > max) {
      max = squaredDelta;
    }
    x1 = x2;
    y1 = y2;
  }
  return max;
}
function arrayMaxSquaredDelta(flatCoordinates, offset, ends, stride, max) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    max = maxSquaredDelta(flatCoordinates, offset, end, stride, max);
    offset = end;
  }
  return max;
}
function multiArrayMaxSquaredDelta(flatCoordinates, offset, endss, stride, max) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    max = arrayMaxSquaredDelta(flatCoordinates, offset, ends, stride, max);
    offset = ends[ends.length - 1];
  }
  return max;
}
function assignClosestPoint(flatCoordinates, offset, end, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
  if (offset == end) {
    return minSquaredDistance;
  }
  let i, squaredDistance2;
  if (maxDelta === 0) {
    squaredDistance2 = squaredDistance(
      x,
      y,
      flatCoordinates[offset],
      flatCoordinates[offset + 1]
    );
    if (squaredDistance2 < minSquaredDistance) {
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[offset + i];
      }
      closestPoint.length = stride;
      return squaredDistance2;
    }
    return minSquaredDistance;
  }
  tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
  let index = offset + stride;
  while (index < end) {
    assignClosest(
      flatCoordinates,
      index - stride,
      index,
      stride,
      x,
      y,
      tmpPoint
    );
    squaredDistance2 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance2 < minSquaredDistance) {
      minSquaredDistance = squaredDistance2;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
      index += stride;
    } else {
      index += stride * Math.max(
        (Math.sqrt(squaredDistance2) - Math.sqrt(minSquaredDistance)) / maxDelta | 0,
        1
      );
    }
  }
  if (isRing) {
    assignClosest(
      flatCoordinates,
      end - stride,
      offset,
      stride,
      x,
      y,
      tmpPoint
    );
    squaredDistance2 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance2 < minSquaredDistance) {
      minSquaredDistance = squaredDistance2;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
}
function assignClosestArrayPoint(flatCoordinates, offset, ends, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
  tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    minSquaredDistance = assignClosestPoint(
      flatCoordinates,
      offset,
      end,
      stride,
      maxDelta,
      isRing,
      x,
      y,
      closestPoint,
      minSquaredDistance,
      tmpPoint
    );
    offset = end;
  }
  return minSquaredDistance;
}
function assignClosestMultiArrayPoint(flatCoordinates, offset, endss, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
  tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    minSquaredDistance = assignClosestArrayPoint(
      flatCoordinates,
      offset,
      ends,
      stride,
      maxDelta,
      isRing,
      x,
      y,
      closestPoint,
      minSquaredDistance,
      tmpPoint
    );
    offset = ends[ends.length - 1];
  }
  return minSquaredDistance;
}

// node_modules/ol/geom/flat/segments.js
function forEach(flatCoordinates, offset, end, stride, callback) {
  let ret;
  offset += stride;
  for (; offset < end; offset += stride) {
    ret = callback(
      flatCoordinates.slice(offset - stride, offset),
      flatCoordinates.slice(offset, offset + stride)
    );
    if (ret) {
      return ret;
    }
  }
  return false;
}

// node_modules/ol/geom/flat/contains.js
function linearRingContainsExtent(flatCoordinates, offset, end, stride, extent) {
  const outside = forEachCorner(
    extent,
    /**
     * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
     * @return {boolean} Contains (x, y).
     */
    function(coordinate) {
      return !linearRingContainsXY(
        flatCoordinates,
        offset,
        end,
        stride,
        coordinate[0],
        coordinate[1]
      );
    }
  );
  return !outside;
}
function linearRingContainsXY(flatCoordinates, offset, end, stride, x, y) {
  let wn = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    if (y1 <= y) {
      if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) {
        wn++;
      }
    } else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) {
      wn--;
    }
    x1 = x2;
    y1 = y2;
  }
  return wn !== 0;
}
function linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y) {
  if (ends.length === 0) {
    return false;
  }
  if (!linearRingContainsXY(flatCoordinates, offset, ends[0], stride, x, y)) {
    return false;
  }
  for (let i = 1, ii = ends.length; i < ii; ++i) {
    if (linearRingContainsXY(flatCoordinates, ends[i - 1], ends[i], stride, x, y)) {
      return false;
    }
  }
  return true;
}
function linearRingssContainsXY(flatCoordinates, offset, endss, stride, x, y) {
  if (endss.length === 0) {
    return false;
  }
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    if (linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
}

// node_modules/ol/geom/flat/intersectsextent.js
function intersectsLineString(flatCoordinates, offset, end, stride, extent, coordinatesExtent) {
  coordinatesExtent = coordinatesExtent ?? extendFlatCoordinates(createEmpty(), flatCoordinates, offset, end, stride);
  if (!intersects(extent, coordinatesExtent)) {
    return false;
  }
  if (coordinatesExtent[0] >= extent[0] && coordinatesExtent[2] <= extent[2] || coordinatesExtent[1] >= extent[1] && coordinatesExtent[3] <= extent[3]) {
    return true;
  }
  return forEach(
    flatCoordinates,
    offset,
    end,
    stride,
    /**
     * @param {import("../../coordinate.js").Coordinate} point1 Start point.
     * @param {import("../../coordinate.js").Coordinate} point2 End point.
     * @return {boolean} `true` if the segment and the extent intersect,
     *     `false` otherwise.
     */
    function(point1, point2) {
      return intersectsSegment(extent, point1, point2);
    }
  );
}
function intersectsLineStringArray(flatCoordinates, offset, ends, stride, extent) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    if (intersectsLineString(flatCoordinates, offset, ends[i], stride, extent)) {
      return true;
    }
    offset = ends[i];
  }
  return false;
}
function intersectsLinearRing(flatCoordinates, offset, end, stride, extent) {
  if (intersectsLineString(flatCoordinates, offset, end, stride, extent)) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent[0],
    extent[1]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent[0],
    extent[3]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent[2],
    extent[1]
  )) {
    return true;
  }
  if (linearRingContainsXY(
    flatCoordinates,
    offset,
    end,
    stride,
    extent[2],
    extent[3]
  )) {
    return true;
  }
  return false;
}
function intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent) {
  if (!intersectsLinearRing(flatCoordinates, offset, ends[0], stride, extent)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  for (let i = 1, ii = ends.length; i < ii; ++i) {
    if (linearRingContainsExtent(
      flatCoordinates,
      ends[i - 1],
      ends[i],
      stride,
      extent
    )) {
      if (!intersectsLineString(
        flatCoordinates,
        ends[i - 1],
        ends[i],
        stride,
        extent
      )) {
        return false;
      }
    }
  }
  return true;
}
function intersectsLinearRingMultiArray(flatCoordinates, offset, endss, stride, extent) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    if (intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
}

export {
  inflateCoordinates,
  inflateCoordinatesArray,
  inflateMultiCoordinatesArray,
  douglasPeucker,
  douglasPeuckerArray,
  snap,
  quantizeArray,
  quantizeMultiArray,
  maxSquaredDelta,
  arrayMaxSquaredDelta,
  multiArrayMaxSquaredDelta,
  assignClosestPoint,
  assignClosestArrayPoint,
  assignClosestMultiArrayPoint,
  linearRingsContainsXY,
  linearRingssContainsXY,
  forEach,
  intersectsLineString,
  intersectsLineStringArray,
  intersectsLinearRingArray,
  intersectsLinearRingMultiArray
};
//# sourceMappingURL=chunk-K34HLHNL.js.map
