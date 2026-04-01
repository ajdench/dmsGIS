import {
  featureCollection,
  featureEach,
  flattenEach,
  isObject,
  multiPolygon,
  union
} from "./chunk-KLWHS34A.js";
import "./chunk-G3PMV62Z.js";

// node_modules/@turf/invariant/dist/esm/index.js
function collectionOf(featureCollection2, type, name) {
  if (!featureCollection2) {
    throw new Error("No featureCollection passed");
  }
  if (!name) {
    throw new Error(".collectionOf() requires a name");
  }
  if (!featureCollection2 || featureCollection2.type !== "FeatureCollection") {
    throw new Error(
      "Invalid input to " + name + ", FeatureCollection required"
    );
  }
  for (const feature of featureCollection2.features) {
    if (!feature || feature.type !== "Feature" || !feature.geometry) {
      throw new Error(
        "Invalid input to " + name + ", Feature with geometry required"
      );
    }
    if (!feature.geometry || feature.geometry.type !== type) {
      throw new Error(
        "Invalid input to " + name + ": must be a " + type + ", given " + feature.geometry.type
      );
    }
  }
}

// node_modules/@turf/flatten/dist/esm/index.js
function flatten(geojson) {
  if (!geojson) throw new Error("geojson is required");
  var results = [];
  flattenEach(geojson, function(feature) {
    results.push(feature);
  });
  return featureCollection(results);
}

// node_modules/@turf/dissolve/dist/esm/index.js
function dissolve(fc, options = {}) {
  options = options || {};
  if (!isObject(options)) throw new Error("options is invalid");
  const { propertyName } = options;
  collectionOf(fc, "Polygon", "dissolve");
  const outFeatures = [];
  if (!propertyName) {
    return flatten(
      multiPolygon(
        union.apply(
          null,
          // List of polygons expressed as Position[][][] a.k.a. Geom[]
          fc.features.map(function(f) {
            return f.geometry.coordinates;
          })
        )
      )
    );
  } else {
    const uniquePropertyVals = {};
    featureEach(fc, function(feature) {
      if (feature.properties) {
        if (!Object.prototype.hasOwnProperty.call(
          uniquePropertyVals,
          feature.properties[propertyName]
        )) {
          uniquePropertyVals[feature.properties[propertyName]] = [];
        }
        uniquePropertyVals[feature.properties[propertyName]].push(feature);
      }
    });
    const vals = Object.keys(uniquePropertyVals);
    for (let i = 0; i < vals.length; i++) {
      const mp = multiPolygon(
        union.apply(
          null,
          // List of polygons expressed as Position[][][] a.k.a. Geom[]
          uniquePropertyVals[vals[i]].map(function(f) {
            return f.geometry.coordinates;
          })
        )
      );
      if (mp && mp.properties) {
        mp.properties[propertyName] = vals[i];
        outFeatures.push(mp);
      }
    }
  }
  return flatten(featureCollection(outFeatures));
}
var index_default = dissolve;
export {
  index_default as default,
  dissolve
};
//# sourceMappingURL=@turf_dissolve.js.map
