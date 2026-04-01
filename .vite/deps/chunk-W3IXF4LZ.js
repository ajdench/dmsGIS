import {
  clamp,
  toFixed
} from "./chunk-64CD5QBF.js";
import {
  abstract,
  assert,
  getUid
} from "./chunk-CVMN3R34.js";
import {
  EventType_default,
  Target_default
} from "./chunk-HNILZFEP.js";

// node_modules/ol/ImageState.js
var ImageState_default = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
  EMPTY: 4
};

// node_modules/ol/has.js
var ua = typeof navigator !== "undefined" && typeof navigator.userAgent !== "undefined" ? navigator.userAgent.toLowerCase() : "";
var SAFARI = ua.includes("safari") && !ua.includes("chrom");
var SAFARI_BUG_237906 = SAFARI && (ua.includes("version/15.4") || /cpu (os|iphone os) 15_4 like mac os x/.test(ua));
var WEBKIT = ua.includes("webkit") && !ua.includes("edge");
var MAC = ua.includes("macintosh");
var DEVICE_PIXEL_RATIO = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
var WORKER_OFFSCREEN_CANVAS = typeof WorkerGlobalScope !== "undefined" && typeof OffscreenCanvas !== "undefined" && self instanceof WorkerGlobalScope;
var IMAGE_DECODE = typeof Image !== "undefined" && Image.prototype.decode;
var PASSIVE_EVENT_LISTENERS = (function() {
  let passive = false;
  try {
    const options = Object.defineProperty({}, "passive", {
      get: function() {
        passive = true;
      }
    });
    window.addEventListener("_", null, options);
    window.removeEventListener("_", null, options);
  } catch {
  }
  return passive;
})();

// node_modules/ol/dom.js
function createCanvasContext2D(width, height, canvasPool, settings) {
  let canvas;
  if (canvasPool && canvasPool.length) {
    canvas = /** @type {HTMLCanvasElement} */
    canvasPool.shift();
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new class extends OffscreenCanvas {
      style = {};
    }(width ?? 300, height ?? 150);
  } else {
    canvas = document.createElement("canvas");
  }
  if (width) {
    canvas.width = width;
  }
  if (height) {
    canvas.height = height;
  }
  return (
    /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */
    canvas.getContext("2d", settings)
  );
}
var sharedCanvasContext;
function getSharedCanvasContext2D() {
  if (!sharedCanvasContext) {
    sharedCanvasContext = createCanvasContext2D(1, 1);
  }
  return sharedCanvasContext;
}
function releaseCanvas(context) {
  const canvas = context.canvas;
  canvas.width = 1;
  canvas.height = 1;
  context.clearRect(0, 0, 1, 1);
}
function replaceNode(newNode, oldNode) {
  const parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
}
function removeChildren(node) {
  while (node.lastChild) {
    node.lastChild.remove();
  }
}
function replaceChildren(node, children) {
  const oldChildren = node.childNodes;
  for (let i = 0; true; ++i) {
    const oldChild = oldChildren[i];
    const newChild = children[i];
    if (!oldChild && !newChild) {
      break;
    }
    if (oldChild === newChild) {
      continue;
    }
    if (!oldChild) {
      node.appendChild(newChild);
      continue;
    }
    if (!newChild) {
      node.removeChild(oldChild);
      --i;
      continue;
    }
    node.insertBefore(newChild, oldChild);
  }
}
function createMockDiv() {
  const mockedDiv = new Proxy(
    {
      /**
       * @type {Array<HTMLElement>}
       */
      childNodes: [],
      /**
       * @param {HTMLElement} node html node.
       * @return {HTMLElement} html node.
       */
      appendChild: function(node) {
        this.childNodes.push(node);
        return node;
      },
      /**
       * dummy function, as this structure is not supposed to have a parent.
       */
      remove: function() {
      },
      /**
       * @param {HTMLElement} node html node.
       * @return {HTMLElement} html node.
       */
      removeChild: function(node) {
        const index = this.childNodes.indexOf(node);
        if (index === -1) {
          throw new Error("Node to remove was not found");
        }
        this.childNodes.splice(index, 1);
        return node;
      },
      /**
       * @param {HTMLElement} newNode new html node.
       * @param {HTMLElement} referenceNode reference html node.
       * @return {HTMLElement} new html node.
       */
      insertBefore: function(newNode, referenceNode) {
        const index = this.childNodes.indexOf(referenceNode);
        if (index === -1) {
          throw new Error("Reference node not found");
        }
        this.childNodes.splice(index, 0, newNode);
        return newNode;
      },
      style: {}
    },
    {
      get(target, prop, receiver) {
        if (prop === "firstElementChild") {
          return target.childNodes.length > 0 ? target.childNodes[0] : null;
        }
        return Reflect.get(target, prop, receiver);
      }
    }
  );
  return (
    /** @type {HTMLDivElement} */
    /** @type {*} */
    mockedDiv
  );
}
function isCanvas(obj) {
  return typeof HTMLCanvasElement !== "undefined" && obj instanceof HTMLCanvasElement || typeof OffscreenCanvas !== "undefined" && obj instanceof OffscreenCanvas;
}

// node_modules/ol/color.js
var NO_COLOR = [NaN, NaN, NaN, 0];
var colorParseContext;
function getColorParseContext() {
  if (!colorParseContext) {
    colorParseContext = createCanvasContext2D(1, 1, void 0, {
      willReadFrequently: true,
      desynchronized: true
    });
  }
  return colorParseContext;
}
var rgbModernRegEx = /^rgba?\(\s*(\d+%?)\s+(\d+%?)\s+(\d+%?)(?:\s*\/\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
var rgbLegacyAbsoluteRegEx = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
var rgbLegacyPercentageRegEx = /^rgba?\(\s*(\d+%)\s*,\s*(\d+%)\s*,\s*(\d+%)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
var hexRegEx = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
function toColorComponent(s, divider) {
  return s.endsWith("%") ? Number(s.substring(0, s.length - 1)) / divider : Number(s);
}
function throwInvalidColor(color) {
  throw new Error('failed to parse "' + color + '" as color');
}
function parseRgba(color) {
  if (color.toLowerCase().startsWith("rgb")) {
    const rgb = color.match(rgbLegacyAbsoluteRegEx) || color.match(rgbModernRegEx) || color.match(rgbLegacyPercentageRegEx);
    if (rgb) {
      const alpha = rgb[4];
      const rgbDivider = 100 / 255;
      return [
        clamp(toColorComponent(rgb[1], rgbDivider) + 0.5 | 0, 0, 255),
        clamp(toColorComponent(rgb[2], rgbDivider) + 0.5 | 0, 0, 255),
        clamp(toColorComponent(rgb[3], rgbDivider) + 0.5 | 0, 0, 255),
        alpha !== void 0 ? clamp(toColorComponent(alpha, 100), 0, 1) : 1
      ];
    }
    throwInvalidColor(color);
  }
  if (color.startsWith("#")) {
    if (hexRegEx.test(color)) {
      const hex = color.substring(1);
      const step = hex.length <= 4 ? 1 : 2;
      const colorFromHex = [0, 0, 0, 255];
      for (let i = 0, ii = hex.length; i < ii; i += step) {
        let colorComponent = parseInt(hex.substring(i, i + step), 16);
        if (step === 1) {
          colorComponent += colorComponent << 4;
        }
        colorFromHex[i / step] = colorComponent;
      }
      colorFromHex[3] = colorFromHex[3] / 255;
      return colorFromHex;
    }
    throwInvalidColor(color);
  }
  const context = getColorParseContext();
  context.fillStyle = "#abcdef";
  let invalidCheckFillStyle = context.fillStyle;
  context.fillStyle = color;
  if (context.fillStyle === invalidCheckFillStyle) {
    context.fillStyle = "#fedcba";
    invalidCheckFillStyle = context.fillStyle;
    context.fillStyle = color;
    if (context.fillStyle === invalidCheckFillStyle) {
      throwInvalidColor(color);
    }
  }
  const colorString = context.fillStyle;
  if (colorString.startsWith("#") || colorString.startsWith("rgba")) {
    return parseRgba(colorString);
  }
  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const colorFromImage = Array.from(context.getImageData(0, 0, 1, 1).data);
  colorFromImage[3] = toFixed(colorFromImage[3] / 255, 3);
  return colorFromImage;
}
function asString(color) {
  if (typeof color === "string") {
    return color;
  }
  return toString(color);
}
var MAX_CACHE_SIZE = 1024;
var cache = {};
var cacheSize = 0;
function withAlpha(color) {
  if (color.length === 4) {
    return color;
  }
  const output = color.slice();
  output[3] = 1;
  return output;
}
function b1(v) {
  return v > 31308e-7 ? Math.pow(v, 1 / 2.4) * 269.025 - 14.025 : v * 3294.6;
}
function b2(v) {
  return v > 0.2068965 ? Math.pow(v, 3) : (v - 4 / 29) * (108 / 841);
}
function a1(v) {
  return v > 10.314724 ? Math.pow((v + 14.025) / 269.025, 2.4) : v / 3294.6;
}
function a2(v) {
  return v > 88564e-7 ? Math.pow(v, 1 / 3) : v / (108 / 841) + 4 / 29;
}
function rgbaToLcha(color) {
  const r = a1(color[0]);
  const g = a1(color[1]);
  const b = a1(color[2]);
  const y = a2(r * 0.222488403 + g * 0.716873169 + b * 0.06060791);
  const l = 500 * (a2(r * 0.452247074 + g * 0.399439023 + b * 0.148375274) - y);
  const q = 200 * (y - a2(r * 0.016863605 + g * 0.117638439 + b * 0.865350722));
  const h = Math.atan2(q, l) * (180 / Math.PI);
  return [
    116 * y - 16,
    Math.sqrt(l * l + q * q),
    h < 0 ? h + 360 : h,
    color[3]
  ];
}
function lchaToRgba(color) {
  const l = (color[0] + 16) / 116;
  const c = color[1];
  const h = color[2] * Math.PI / 180;
  const y = b2(l);
  const x = b2(l + c / 500 * Math.cos(h));
  const z = b2(l - c / 200 * Math.sin(h));
  const r = b1(x * 3.021973625 - y * 1.617392459 - z * 0.404875592);
  const g = b1(x * -0.943766287 + y * 1.916279586 + z * 0.027607165);
  const b = b1(x * 0.069407491 - y * 0.22898585 + z * 1.159737864);
  return [
    clamp(r + 0.5 | 0, 0, 255),
    clamp(g + 0.5 | 0, 0, 255),
    clamp(b + 0.5 | 0, 0, 255),
    color[3]
  ];
}
function fromString(s) {
  if (s === "none") {
    return NO_COLOR;
  }
  if (cache.hasOwnProperty(s)) {
    return cache[s];
  }
  if (cacheSize >= MAX_CACHE_SIZE) {
    let i = 0;
    for (const key in cache) {
      if ((i++ & 3) === 0) {
        delete cache[key];
        --cacheSize;
      }
    }
  }
  const color = parseRgba(s);
  if (color.length !== 4) {
    throwInvalidColor(s);
  }
  for (const c of color) {
    if (isNaN(c)) {
      throwInvalidColor(s);
    }
  }
  cache[s] = color;
  ++cacheSize;
  return color;
}
function asArray(color) {
  if (Array.isArray(color)) {
    return color;
  }
  return fromString(color);
}
function toString(color) {
  let r = color[0];
  if (r != (r | 0)) {
    r = r + 0.5 | 0;
  }
  let g = color[1];
  if (g != (g | 0)) {
    g = g + 0.5 | 0;
  }
  let b = color[2];
  if (b != (b | 0)) {
    b = b + 0.5 | 0;
  }
  const a = color[3] === void 0 ? 1 : Math.round(color[3] * 1e3) / 1e3;
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

// node_modules/ol/Image.js
function load(image, src) {
  return new Promise((resolve, reject) => {
    function handleLoad() {
      unlisten();
      resolve(image);
    }
    function handleError() {
      unlisten();
      reject(new Error("Image load error"));
    }
    function unlisten() {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    }
    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    if (src) {
      image.src = src;
    }
  });
}
function decodeFallback(image, src) {
  if (src) {
    image.src = src;
  }
  return image.src && IMAGE_DECODE ? new Promise(
    (resolve, reject) => image.decode().then(() => resolve(image)).catch(
      (e) => image.complete && image.width ? resolve(image) : reject(e)
    )
  ) : load(image);
}

// node_modules/ol/style/IconImageCache.js
var IconImageCache = class {
  constructor() {
    this.cache_ = {};
    this.patternCache_ = {};
    this.cacheSize_ = 0;
    this.maxCacheSize_ = 1024;
  }
  /**
   * FIXME empty description for jsdoc
   */
  clear() {
    this.cache_ = {};
    this.patternCache_ = {};
    this.cacheSize_ = 0;
  }
  /**
   * @return {boolean} Can expire cache.
   */
  canExpireCache() {
    return this.cacheSize_ > this.maxCacheSize_;
  }
  /**
   * FIXME empty description for jsdoc
   */
  expire() {
    if (this.canExpireCache()) {
      let i = 0;
      for (const key in this.cache_) {
        const iconImage = this.cache_[key];
        if ((i++ & 3) === 0 && !iconImage.hasListener()) {
          delete this.cache_[key];
          delete this.patternCache_[key];
          --this.cacheSize_;
        }
      }
    }
  }
  /**
   * @param {string} src Src.
   * @param {import("../color.js").Color|string|null} color Color.
   * @return {import("./IconImage.js").default} Icon image.
   */
  get(src, color) {
    const key = getCacheKey(src, color);
    const icon = key in this.cache_ ? this.cache_[key] : null;
    return icon;
  }
  /**
   * @param {string} src Src.
   * @param {import("../color.js").Color|string|null} color Color.
   * @return {CanvasPattern} Icon image.
   */
  getPattern(src, color) {
    const key = getCacheKey(src, color);
    return key in this.patternCache_ ? this.patternCache_[key] : null;
  }
  /**
   * @param {string} src Src.
   * @param {import("../color.js").Color|string|null} color Color.
   * @param {import("./IconImage.js").default|null} iconImage Icon image.
   * @param {boolean} [pattern] Also cache a `'repeat'` pattern with this `iconImage`.
   */
  set(src, color, iconImage, pattern) {
    const key = getCacheKey(src, color);
    const update = key in this.cache_;
    this.cache_[key] = iconImage;
    if (pattern) {
      if (iconImage.getImageState() === ImageState_default.IDLE) {
        iconImage.load();
      }
      if (iconImage.getImageState() === ImageState_default.LOADING) {
        iconImage.ready().then(() => {
          this.patternCache_[key] = getSharedCanvasContext2D().createPattern(
            iconImage.getImage(1),
            "repeat"
          );
        });
      } else {
        this.patternCache_[key] = getSharedCanvasContext2D().createPattern(
          iconImage.getImage(1),
          "repeat"
        );
      }
    }
    if (!update) {
      ++this.cacheSize_;
    }
  }
  /**
   * Set the cache size of the icon cache. Default is `1024`. Change this value when
   * your map uses more than 1024 different icon images and you are not caching icon
   * styles on the application level.
   * @param {number} maxCacheSize Cache max size.
   * @api
   */
  setSize(maxCacheSize) {
    this.maxCacheSize_ = maxCacheSize;
    this.expire();
  }
};
function getCacheKey(src, color) {
  const colorString = color ? asArray(color) : "null";
  return src + ":" + colorString;
}
var shared = new IconImageCache();

// node_modules/ol/style/IconImage.js
var taintedTestContext = null;
var IconImage = class extends Target_default {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap|null} image Image.
   * @param {string|undefined} src Src.
   * @param {import('../dom').ImageAttributes} imageAttributes Image attributes options.
   * @param {import("../ImageState.js").default|undefined} imageState Image state.
   * @param {import("../color.js").Color|string|null} color Color.
   */
  constructor(image, src, imageAttributes, imageState, color) {
    super();
    this.hitDetectionImage_ = null;
    this.image_ = image;
    this.crossOrigin_ = imageAttributes?.crossOrigin;
    this.referrerPolicy_ = imageAttributes?.referrerPolicy;
    this.canvas_ = {};
    this.color_ = color;
    this.imageState_ = imageState === void 0 ? ImageState_default.IDLE : imageState;
    this.size_ = image && image.width && image.height ? [image.width, image.height] : null;
    this.src_ = src;
    this.tainted_;
    this.ready_ = null;
  }
  /**
   * @private
   */
  initializeImage_() {
    this.image_ = new Image();
    if (this.crossOrigin_ !== null) {
      this.image_.crossOrigin = this.crossOrigin_;
    }
    if (this.referrerPolicy_ !== void 0) {
      this.image_.referrerPolicy = this.referrerPolicy_;
    }
  }
  /**
   * @private
   * @return {boolean} The image canvas is tainted.
   */
  isTainted_() {
    if (this.tainted_ === void 0 && this.imageState_ === ImageState_default.LOADED) {
      if (!taintedTestContext) {
        taintedTestContext = createCanvasContext2D(1, 1, void 0, {
          willReadFrequently: true
        });
      }
      taintedTestContext.drawImage(this.image_, 0, 0);
      try {
        taintedTestContext.getImageData(0, 0, 1, 1);
        this.tainted_ = false;
      } catch {
        taintedTestContext = null;
        this.tainted_ = true;
      }
    }
    return this.tainted_ === true;
  }
  /**
   * @private
   */
  dispatchChangeEvent_() {
    this.dispatchEvent(EventType_default.CHANGE);
  }
  /**
   * @private
   */
  handleImageError_() {
    this.imageState_ = ImageState_default.ERROR;
    this.dispatchChangeEvent_();
  }
  /**
   * @private
   */
  handleImageLoad_() {
    this.imageState_ = ImageState_default.LOADED;
    this.size_ = [this.image_.width, this.image_.height];
    this.dispatchChangeEvent_();
  }
  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap} Image or Canvas element or image bitmap.
   */
  getImage(pixelRatio) {
    if (!this.image_) {
      this.initializeImage_();
    }
    this.replaceColor_(pixelRatio);
    return this.canvas_[pixelRatio] ? this.canvas_[pixelRatio] : this.image_;
  }
  /**
   * @param {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap} image Image.
   */
  setImage(image) {
    this.image_ = image;
  }
  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Image or Canvas element.
   */
  getPixelRatio(pixelRatio) {
    this.replaceColor_(pixelRatio);
    return this.canvas_[pixelRatio] ? pixelRatio : 1;
  }
  /**
   * @return {import("../ImageState.js").default} Image state.
   */
  getImageState() {
    return this.imageState_;
  }
  /**
   * @return {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap} Image element.
   */
  getHitDetectionImage() {
    if (!this.image_) {
      this.initializeImage_();
    }
    if (!this.hitDetectionImage_) {
      if (this.isTainted_()) {
        const width = this.size_[0];
        const height = this.size_[1];
        const context = createCanvasContext2D(width, height);
        context.fillRect(0, 0, width, height);
        this.hitDetectionImage_ = context.canvas;
      } else {
        this.hitDetectionImage_ = this.image_;
      }
    }
    return this.hitDetectionImage_;
  }
  /**
   * Get the size of the icon (in pixels).
   * @return {import("../size.js").Size} Image size.
   */
  getSize() {
    return this.size_;
  }
  /**
   * @return {string|undefined} Image src.
   */
  getSrc() {
    return this.src_;
  }
  /**
   * Load not yet loaded URI.
   */
  load() {
    if (this.imageState_ !== ImageState_default.IDLE) {
      return;
    }
    if (!this.image_) {
      this.initializeImage_();
    }
    this.imageState_ = ImageState_default.LOADING;
    try {
      if (this.src_ !== void 0) {
        this.image_.src = this.src_;
      }
    } catch {
      this.handleImageError_();
    }
    if (this.image_ instanceof HTMLImageElement) {
      decodeFallback(this.image_, this.src_).then((image) => {
        this.image_ = image;
        this.handleImageLoad_();
      }).catch(this.handleImageError_.bind(this));
    }
  }
  /**
   * @param {number} pixelRatio Pixel ratio.
   * @private
   */
  replaceColor_(pixelRatio) {
    if (!this.color_ || this.canvas_[pixelRatio] || this.imageState_ !== ImageState_default.LOADED) {
      return;
    }
    const image = this.image_;
    const ctx = createCanvasContext2D(
      Math.ceil(image.width * pixelRatio),
      Math.ceil(image.height * pixelRatio)
    );
    const canvas = ctx.canvas;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = asString(this.color_);
    ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(image, 0, 0);
    this.canvas_[pixelRatio] = canvas;
  }
  /**
   * @return {Promise<void>} Promise that resolves when the image is loaded.
   */
  ready() {
    if (!this.ready_) {
      this.ready_ = new Promise((resolve) => {
        if (this.imageState_ === ImageState_default.LOADED || this.imageState_ === ImageState_default.ERROR) {
          resolve();
        } else {
          const onChange = () => {
            if (this.imageState_ === ImageState_default.LOADED || this.imageState_ === ImageState_default.ERROR) {
              this.removeEventListener(EventType_default.CHANGE, onChange);
              resolve();
            }
          };
          this.addEventListener(EventType_default.CHANGE, onChange);
        }
      });
    }
    return this.ready_;
  }
};
function get(image, src, imageAttributes, imageState, color, pattern) {
  let iconImage = src === void 0 ? void 0 : shared.get(src, color);
  if (!iconImage) {
    iconImage = new IconImage(
      image,
      image && "src" in image ? image.src || void 0 : src,
      imageAttributes,
      imageState,
      color
    );
    shared.set(src, color, iconImage, pattern);
  }
  if (pattern && iconImage && !shared.getPattern(src, color)) {
    shared.set(src, color, iconImage, pattern);
  }
  return iconImage;
}
var IconImage_default = IconImage;

// node_modules/ol/size.js
function hasArea(size) {
  return size[0] > 0 && size[1] > 0;
}
function toSize(size, dest) {
  if (Array.isArray(size)) {
    return size;
  }
  if (dest === void 0) {
    dest = [size, size];
  } else {
    dest[0] = size;
    dest[1] = size;
  }
  return dest;
}

// node_modules/ol/style/Image.js
var ImageStyle = class _ImageStyle {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    this.opacity_ = options.opacity;
    this.rotateWithView_ = options.rotateWithView;
    this.rotation_ = options.rotation;
    this.scale_ = options.scale;
    this.scaleArray_ = toSize(options.scale);
    this.displacement_ = options.displacement;
    this.declutterMode_ = options.declutterMode;
  }
  /**
   * Clones the style.
   * @return {ImageStyle} The cloned style.
   * @api
   */
  clone() {
    const scale = this.getScale();
    return new _ImageStyle({
      opacity: this.getOpacity(),
      scale: Array.isArray(scale) ? scale.slice() : scale,
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
      displacement: this.getDisplacement().slice(),
      declutterMode: this.getDeclutterMode()
    });
  }
  /**
   * Get the symbolizer opacity.
   * @return {number} Opacity.
   * @api
   */
  getOpacity() {
    return this.opacity_;
  }
  /**
   * Determine whether the symbolizer rotates with the map.
   * @return {boolean} Rotate with map.
   * @api
   */
  getRotateWithView() {
    return this.rotateWithView_;
  }
  /**
   * Get the symoblizer rotation.
   * @return {number} Rotation.
   * @api
   */
  getRotation() {
    return this.rotation_;
  }
  /**
   * Get the symbolizer scale.
   * @return {number|import("../size.js").Size} Scale.
   * @api
   */
  getScale() {
    return this.scale_;
  }
  /**
   * Get the symbolizer scale array.
   * @return {import("../size.js").Size} Scale array.
   */
  getScaleArray() {
    return this.scaleArray_;
  }
  /**
   * Get the displacement of the shape
   * @return {Array<number>} Shape's center displacement
   * @api
   */
  getDisplacement() {
    return this.displacement_;
  }
  /**
   * Get the declutter mode of the shape
   * @return {import("./Style.js").DeclutterMode} Shape's declutter mode
   * @api
   */
  getDeclutterMode() {
    return this.declutterMode_;
  }
  /**
   * Get the anchor point in pixels. The anchor determines the center point for the
   * symbolizer.
   * @abstract
   * @return {Array<number>} Anchor.
   */
  getAnchor() {
    return abstract();
  }
  /**
   * Get the image element for the symbolizer.
   * @abstract
   * @param {number} pixelRatio Pixel ratio.
   * @return {import('../DataTile.js').ImageLike} Image element.
   */
  getImage(pixelRatio) {
    return abstract();
  }
  /**
   * @abstract
   * @return {import('../DataTile.js').ImageLike} Image element.
   */
  getHitDetectionImage() {
    return abstract();
  }
  /**
   * Get the image pixel ratio.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Pixel ratio.
   */
  getPixelRatio(pixelRatio) {
    return 1;
  }
  /**
   * @abstract
   * @return {import("../ImageState.js").default} Image state.
   */
  getImageState() {
    return abstract();
  }
  /**
   * @abstract
   * @return {import("../size.js").Size} Image size.
   */
  getImageSize() {
    return abstract();
  }
  /**
   * Get the origin of the symbolizer.
   * @abstract
   * @return {Array<number>} Origin.
   */
  getOrigin() {
    return abstract();
  }
  /**
   * Get the size of the symbolizer (in pixels).
   * @abstract
   * @return {import("../size.js").Size} Size.
   */
  getSize() {
    return abstract();
  }
  /**
   * Set the displacement.
   *
   * @param {Array<number>} displacement Displacement.
   * @api
   */
  setDisplacement(displacement) {
    this.displacement_ = displacement;
  }
  /**
   * Set the opacity.
   *
   * @param {number} opacity Opacity.
   * @api
   */
  setOpacity(opacity) {
    this.opacity_ = opacity;
  }
  /**
   * Set whether to rotate the style with the view.
   *
   * @param {boolean} rotateWithView Rotate with map.
   * @api
   */
  setRotateWithView(rotateWithView) {
    this.rotateWithView_ = rotateWithView;
  }
  /**
   * Set the rotation.
   *
   * @param {number} rotation Rotation.
   * @api
   */
  setRotation(rotation) {
    this.rotation_ = rotation;
  }
  /**
   * Set the scale.
   *
   * @param {number|import("../size.js").Size} scale Scale.
   * @api
   */
  setScale(scale) {
    this.scale_ = scale;
    this.scaleArray_ = toSize(scale);
  }
  /**
   * @abstract
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   */
  listenImageChange(listener) {
    abstract();
  }
  /**
   * Load not yet loaded URI.
   * @abstract
   */
  load() {
    abstract();
  }
  /**
   * @abstract
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   */
  unlistenImageChange(listener) {
    abstract();
  }
  /**
   * @return {Promise<void>} `false` or Promise that resolves when the style is ready to use.
   */
  ready() {
    return Promise.resolve();
  }
};
var Image_default = ImageStyle;

// node_modules/ol/style/Icon.js
function calculateScale(width, height, wantedWidth, wantedHeight) {
  if (wantedWidth !== void 0 && wantedHeight !== void 0) {
    return [wantedWidth / width, wantedHeight / height];
  }
  if (wantedWidth !== void 0) {
    return wantedWidth / width;
  }
  if (wantedHeight !== void 0) {
    return wantedHeight / height;
  }
  return 1;
}
var Icon = class _Icon extends Image_default {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options || {};
    const opacity = options.opacity !== void 0 ? options.opacity : 1;
    const rotation = options.rotation !== void 0 ? options.rotation : 0;
    const scale = options.scale !== void 0 ? options.scale : 1;
    const rotateWithView = options.rotateWithView !== void 0 ? options.rotateWithView : false;
    super({
      opacity,
      rotation,
      scale,
      displacement: options.displacement !== void 0 ? options.displacement : [0, 0],
      rotateWithView,
      declutterMode: options.declutterMode
    });
    this.anchor_ = options.anchor !== void 0 ? options.anchor : [0.5, 0.5];
    this.normalizedAnchor_ = null;
    this.anchorOrigin_ = options.anchorOrigin !== void 0 ? options.anchorOrigin : "top-left";
    this.anchorXUnits_ = options.anchorXUnits !== void 0 ? options.anchorXUnits : "fraction";
    this.anchorYUnits_ = options.anchorYUnits !== void 0 ? options.anchorYUnits : "fraction";
    this.crossOrigin_ = options.crossOrigin !== void 0 ? options.crossOrigin : null;
    this.referrerPolicy_ = options.referrerPolicy;
    const image = options.img !== void 0 ? options.img : null;
    let cacheKey = options.src;
    assert(
      !(cacheKey !== void 0 && image),
      "`image` and `src` cannot be provided at the same time"
    );
    if ((cacheKey === void 0 || cacheKey.length === 0) && image) {
      cacheKey = /** @type {HTMLImageElement} */
      image.src || getUid(image);
    }
    assert(
      cacheKey !== void 0 && cacheKey.length > 0,
      "A defined and non-empty `src` or `image` must be provided"
    );
    assert(
      !((options.width !== void 0 || options.height !== void 0) && options.scale !== void 0),
      "`width` or `height` cannot be provided together with `scale`"
    );
    let imageState;
    if (options.src !== void 0) {
      imageState = ImageState_default.IDLE;
    } else if (image !== void 0) {
      if ("complete" in image) {
        if (image.complete) {
          imageState = image.src ? ImageState_default.LOADED : ImageState_default.IDLE;
        } else {
          imageState = ImageState_default.LOADING;
        }
      } else {
        imageState = ImageState_default.LOADED;
      }
    }
    this.color_ = options.color !== void 0 ? asArray(options.color) : null;
    this.iconImage_ = get(
      image,
      /** @type {string} */
      cacheKey,
      {
        crossOrigin: this.crossOrigin_,
        referrerPolicy: this.referrerPolicy_
      },
      imageState,
      this.color_
    );
    this.offset_ = options.offset !== void 0 ? options.offset : [0, 0];
    this.offsetOrigin_ = options.offsetOrigin !== void 0 ? options.offsetOrigin : "top-left";
    this.origin_ = null;
    this.size_ = options.size !== void 0 ? options.size : null;
    this.initialOptions_;
    if (options.width !== void 0 || options.height !== void 0) {
      let width, height;
      if (options.size) {
        [width, height] = options.size;
      } else {
        const image2 = this.getImage(1);
        if (image2.width && image2.height) {
          width = image2.width;
          height = image2.height;
        } else if (image2 instanceof HTMLImageElement) {
          this.initialOptions_ = options;
          const onload = () => {
            this.unlistenImageChange(onload);
            if (!this.initialOptions_) {
              return;
            }
            const imageSize = this.iconImage_.getSize();
            this.setScale(
              calculateScale(
                imageSize[0],
                imageSize[1],
                options.width,
                options.height
              )
            );
          };
          this.listenImageChange(onload);
          return;
        }
      }
      if (width !== void 0) {
        this.setScale(
          calculateScale(width, height, options.width, options.height)
        );
      }
    }
  }
  /**
   * Clones the style. The underlying Image/HTMLCanvasElement is not cloned.
   * @return {Icon} The cloned style.
   * @api
   * @override
   */
  clone() {
    let scale, width, height;
    if (this.initialOptions_) {
      width = this.initialOptions_.width;
      height = this.initialOptions_.height;
    } else {
      scale = this.getScale();
      scale = Array.isArray(scale) ? scale.slice() : scale;
    }
    return new _Icon({
      anchor: this.anchor_.slice(),
      anchorOrigin: this.anchorOrigin_,
      anchorXUnits: this.anchorXUnits_,
      anchorYUnits: this.anchorYUnits_,
      color: this.color_ && this.color_.slice ? this.color_.slice() : this.color_ || void 0,
      crossOrigin: this.crossOrigin_,
      referrerPolicy: this.referrerPolicy_,
      offset: this.offset_.slice(),
      offsetOrigin: this.offsetOrigin_,
      opacity: this.getOpacity(),
      rotateWithView: this.getRotateWithView(),
      rotation: this.getRotation(),
      scale,
      width,
      height,
      size: this.size_ !== null ? this.size_.slice() : void 0,
      src: this.getSrc(),
      displacement: this.getDisplacement().slice(),
      declutterMode: this.getDeclutterMode()
    });
  }
  /**
   * Get the anchor point in pixels. The anchor determines the center point for the
   * symbolizer.
   * @return {Array<number>} Anchor.
   * @api
   * @override
   */
  getAnchor() {
    let anchor = this.normalizedAnchor_;
    if (!anchor) {
      anchor = this.anchor_;
      const size = this.getSize();
      if (this.anchorXUnits_ == "fraction" || this.anchorYUnits_ == "fraction") {
        if (!size) {
          return null;
        }
        anchor = this.anchor_.slice();
        if (this.anchorXUnits_ == "fraction") {
          anchor[0] *= size[0];
        }
        if (this.anchorYUnits_ == "fraction") {
          anchor[1] *= size[1];
        }
      }
      if (this.anchorOrigin_ != "top-left") {
        if (!size) {
          return null;
        }
        if (anchor === this.anchor_) {
          anchor = this.anchor_.slice();
        }
        if (this.anchorOrigin_ == "top-right" || this.anchorOrigin_ == "bottom-right") {
          anchor[0] = -anchor[0] + size[0];
        }
        if (this.anchorOrigin_ == "bottom-left" || this.anchorOrigin_ == "bottom-right") {
          anchor[1] = -anchor[1] + size[1];
        }
      }
      this.normalizedAnchor_ = anchor;
    }
    const displacement = this.getDisplacement();
    const scale = this.getScaleArray();
    return [
      anchor[0] - displacement[0] / scale[0],
      anchor[1] + displacement[1] / scale[1]
    ];
  }
  /**
   * Set the anchor point. The anchor determines the center point for the
   * symbolizer.
   *
   * @param {Array<number>} anchor Anchor.
   * @api
   */
  setAnchor(anchor) {
    this.anchor_ = anchor;
    this.normalizedAnchor_ = null;
  }
  /**
   * Get the icon color.
   * @return {import("../color.js").Color} Color.
   * @api
   */
  getColor() {
    return this.color_;
  }
  /**
   * Set the icon color.
   *
   * Warning: Repeatedly setting the color on an icon style
   * causes the icon image to be re-created each time. This can have a
   * severe performance impact.
   *
   * @param {import("../color.js").Color|string|null|undefined} color Color.
   */
  setColor(color) {
    const nextColor = color ? asArray(color) : null;
    if (this.color_ === nextColor || this.color_ && nextColor && this.color_.length === nextColor.length && this.color_.every((value, index) => value === nextColor[index])) {
      return;
    }
    this.color_ = nextColor;
    const src = this.getSrc();
    const image = src !== void 0 ? null : this.getHitDetectionImage();
    const imageState = src !== void 0 ? ImageState_default.IDLE : this.iconImage_.getImageState();
    this.iconImage_ = get(
      image,
      src,
      {
        crossOrigin: this.crossOrigin_,
        referrerPolicy: this.referrerPolicy_
      },
      imageState,
      this.color_
    );
  }
  /**
   * Get the image icon.
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap} Image or Canvas element. If the Icon
   * style was configured with `src` or with a not let loaded `img`, an `ImageBitmap` will be returned.
   * @api
   * @override
   */
  getImage(pixelRatio) {
    return this.iconImage_.getImage(pixelRatio);
  }
  /**
   * Get the pixel ratio.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} The pixel ratio of the image.
   * @api
   * @override
   */
  getPixelRatio(pixelRatio) {
    return this.iconImage_.getPixelRatio(pixelRatio);
  }
  /**
   * @return {import("../size.js").Size} Image size.
   * @override
   */
  getImageSize() {
    return this.iconImage_.getSize();
  }
  /**
   * @return {import("../ImageState.js").default} Image state.
   * @override
   */
  getImageState() {
    return this.iconImage_.getImageState();
  }
  /**
   * @return {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas|ImageBitmap} Image element.
   * @override
   */
  getHitDetectionImage() {
    return this.iconImage_.getHitDetectionImage();
  }
  /**
   * Get the origin of the symbolizer.
   * @return {Array<number>} Origin.
   * @api
   * @override
   */
  getOrigin() {
    if (this.origin_) {
      return this.origin_;
    }
    let offset = this.offset_;
    if (this.offsetOrigin_ != "top-left") {
      const size = this.getSize();
      const iconImageSize = this.iconImage_.getSize();
      if (!size || !iconImageSize) {
        return null;
      }
      offset = offset.slice();
      if (this.offsetOrigin_ == "top-right" || this.offsetOrigin_ == "bottom-right") {
        offset[0] = iconImageSize[0] - size[0] - offset[0];
      }
      if (this.offsetOrigin_ == "bottom-left" || this.offsetOrigin_ == "bottom-right") {
        offset[1] = iconImageSize[1] - size[1] - offset[1];
      }
    }
    this.origin_ = offset;
    return this.origin_;
  }
  /**
   * Get the image URL.
   * @return {string|undefined} Image src.
   * @api
   */
  getSrc() {
    return this.iconImage_.getSrc();
  }
  /**
   * Set the image URI
   * @param {string} src Image source URI
   * @api
   */
  setSrc(src) {
    this.iconImage_ = get(
      null,
      src,
      {
        crossOrigin: this.crossOrigin_,
        referrerPolicy: this.referrerPolicy_
      },
      ImageState_default.IDLE,
      this.color_
    );
  }
  /**
   * Get the size of the icon (in pixels).
   * @return {import("../size.js").Size} Image size.
   * @api
   * @override
   */
  getSize() {
    return !this.size_ ? this.iconImage_.getSize() : this.size_;
  }
  /**
   * Get the width of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
   * @return {number} Icon width (in pixels).
   * @api
   */
  getWidth() {
    const scale = this.getScaleArray();
    if (this.size_) {
      return this.size_[0] * scale[0];
    }
    if (this.iconImage_.getImageState() == ImageState_default.LOADED) {
      return this.iconImage_.getSize()[0] * scale[0];
    }
    return void 0;
  }
  /**
   * Get the height of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
   * @return {number} Icon height (in pixels).
   * @api
   */
  getHeight() {
    const scale = this.getScaleArray();
    if (this.size_) {
      return this.size_[1] * scale[1];
    }
    if (this.iconImage_.getImageState() == ImageState_default.LOADED) {
      return this.iconImage_.getSize()[1] * scale[1];
    }
    return void 0;
  }
  /**
   * Set the scale.
   *
   * @param {number|import("../size.js").Size} scale Scale.
   * @api
   * @override
   */
  setScale(scale) {
    delete this.initialOptions_;
    super.setScale(scale);
  }
  /**
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   * @override
   */
  listenImageChange(listener) {
    this.iconImage_.addEventListener(EventType_default.CHANGE, listener);
  }
  /**
   * Load not yet loaded URI.
   * When rendering a feature with an icon style, the vector renderer will
   * automatically call this method. However, you might want to call this
   * method yourself for preloading or other purposes.
   * @api
   * @override
   */
  load() {
    this.iconImage_.load();
  }
  /**
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   * @override
   */
  unlistenImageChange(listener) {
    this.iconImage_.removeEventListener(EventType_default.CHANGE, listener);
  }
  /**
   * @override
   */
  ready() {
    return this.iconImage_.ready();
  }
};
var Icon_default = Icon;

export {
  WEBKIT,
  MAC,
  DEVICE_PIXEL_RATIO,
  WORKER_OFFSCREEN_CANVAS,
  PASSIVE_EVENT_LISTENERS,
  createCanvasContext2D,
  getSharedCanvasContext2D,
  releaseCanvas,
  replaceNode,
  removeChildren,
  replaceChildren,
  createMockDiv,
  isCanvas,
  ImageState_default,
  NO_COLOR,
  withAlpha,
  rgbaToLcha,
  lchaToRgba,
  fromString,
  asArray,
  toString,
  shared,
  get,
  IconImage_default,
  hasArea,
  toSize,
  Image_default,
  Icon_default
};
//# sourceMappingURL=chunk-W3IXF4LZ.js.map
