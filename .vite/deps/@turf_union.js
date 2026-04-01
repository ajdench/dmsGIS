import {
  geomEach,
  multiPolygon,
  polygon,
  union
} from "./chunk-KLWHS34A.js";
import "./chunk-G3PMV62Z.js";

// node_modules/@turf/union/dist/esm/index.js
function union2(features, options = {}) {
  const geoms = [];
  geomEach(features, (geom) => {
    geoms.push(geom.coordinates);
  });
  if (geoms.length < 2) {
    throw new Error("Must have at least 2 geometries");
  }
  const unioned = union(geoms[0], ...geoms.slice(1));
  if (unioned.length === 0) return null;
  if (unioned.length === 1) return polygon(unioned[0], options.properties);
  else return multiPolygon(unioned, options.properties);
}
var index_default = union2;
export {
  index_default as default,
  union2 as union
};
//# sourceMappingURL=@turf_union.js.map
