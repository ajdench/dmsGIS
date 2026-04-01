// node_modules/ol/util.js
function abstract() {
  throw new Error("Unimplemented abstract method.");
}
var uidCounter_ = 0;
function getUid(obj) {
  return obj.ol_uid || (obj.ol_uid = String(++uidCounter_));
}

// node_modules/ol/asserts.js
function assert(assertion, errorMessage) {
  if (!assertion) {
    throw new Error(errorMessage);
  }
}

export {
  abstract,
  getUid,
  assert
};
//# sourceMappingURL=chunk-CVMN3R34.js.map
