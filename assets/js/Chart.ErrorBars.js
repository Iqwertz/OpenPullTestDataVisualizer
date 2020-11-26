(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('chart.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'chart.js'], factory) :
  (global = global || self, factory(global.ChartErrorBars = {}, global.Chart));
}(this, function (exports, Chart) { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
      return;
    }

    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  var allModelKeys = ['xMin', 'xMax', 'yMin', 'yMax'];
  function modelKeys(horizontal) {
    return horizontal ? allModelKeys.slice(0, 2) : allModelKeys.slice(2);
  }
  function isSameArray(a, b) {
    return a.length === b.length && a.every(function (v, i) {
      return v === b[i];
    });
  }
  function commonDataLimits(isHorizontal, extraCallback, ignoreIdCheck) {
    var _this = this;

    var chart = this.chart;

    var matchID = function matchID(meta) {
      return isHorizontal ? meta.xAxisID === _this.id : meta.yAxisID === _this.id;
    }; // First Calculate the range


    this.min = null;
    this.max = null;

    var _modelKeys = modelKeys(isHorizontal),
        _modelKeys2 = _slicedToArray(_modelKeys, 2),
        minKey = _modelKeys2[0],
        maxKey = _modelKeys2[1]; // Regular charts use x, y values
    // For the boxplot chart we have rawValue.min and rawValue.max for each point


    chart.data.datasets.forEach(function (d, i) {
      var meta = chart.getDatasetMeta(i);

      if (!chart.isDatasetVisible(i) || !ignoreIdCheck && !matchID(meta)) {
        return;
      }

      d.data.forEach(function (rawValue, j) {
        var value = _this.getRightValue(rawValue);

        if (isNaN(value) || meta.data[j].hidden) {
          return;
        }

        var vMin = rawValue[minKey];

        if (Array.isArray(vMin)) {
          vMin = vMin.reduce(function (acc, v) {
            return Math.min(acc, v);
          }, value);
        } else if (typeof vMin !== 'number') {
          vMin = value;
        }

        if (!isNaN(vMin) && (_this.min === null || vMin < _this.min)) {
          _this.min = vMin;
        }

        var vMax = rawValue[maxKey];

        if (Array.isArray(vMax)) {
          vMax = vMax.reduce(function (acc, v) {
            return Math.max(acc, v);
          }, value);
        } else if (typeof vMin !== 'number') {
          vMax = value;
        }

        if (!isNaN(vMax) && (_this.max === null || vMax > _this.max)) {
          _this.max = vMax;
        }

        if (extraCallback) {
          extraCallback(rawValue, isHorizontal);
        }
      });
    });

    if (this.min == null) {
      this.min = 0;
    }

    if (this.max == null) {
      this.max = 0;
    }
  }

  var defaults = {
    errorBarLineWidth: [[1, 3]],
    errorBarColor: [['#2c2c2c', '#1f1f1f']],
    errorBarWhiskerLineWidth: [[1, 3]],
    errorBarWhiskerRatio: [[0.2, 0.25]],
    errorBarWhiskerSize: [[20, 24]],
    errorBarWhiskerColor: [['#2c2c2c', '#1f1f1f']]
  };
  var styleKeys = Object.keys(defaults);
  function transitionErrorBarHelper(obj) {
    if (!obj) {
      return {};
    }

    var r = {};
    allModelKeys.forEach(function (key) {
      r[key] = obj[key];
    });
    return r;
  }
  function transitionErrorBar(start, startBak, view, model, ease) {
    allModelKeys.forEach(function (key) {
      var m = model[key];

      if (!Array.isArray(m)) {
        // primitive are alrady handled
        return;
      }

      if (!view.hasOwnProperty(key)) {
        view[key] = m.slice();
        return;
      }

      var v = view[key];

      if (!startBak.hasOwnProperty(key)) {
        start[key] = v.slice();
      }

      var s = start[key];

      if (isSameArray(s, m)) {
        return;
      }

      var common = Math.min(m.length, s.length);
      v = view[key] = new Array(common);

      for (var i = 0; i < common; ++i) {
        v[i] = s[i] + (m[i] - s[i]) * ease;
      }
    });
  }

  function resolve(inputs, context, index) {
    for (var i = 0; i < inputs.length; ++i) {
      var value = inputs[i];

      if (value === undefined) {
        continue;
      }

      if (context !== undefined && typeof value === 'function') {
        value = value(context);
      }

      if (index !== undefined && Array.isArray(value)) {
        // use mod to repeat the value and not returning undefined
        value = value[index % value.length];
      }

      if (value !== undefined) {
        return value;
      }
    }
  }
  /**
   * @param {number} index
   */


  function updateErrorBarElement(controller, elem, index) {
    var dataset = controller.getDataset();
    var custom = elem.custom || {};

    var options = controller._elementOptions(); // Scriptable options


    var context = {
      chart: controller.chart,
      dataIndex: index,
      dataset: dataset,
      datasetIndex: controller.index
    };
    styleKeys.forEach(function (item) {
      elem._model[item] = resolve([custom[item], dataset[item], options[item]], context, index);
    });
  }

  function resolveMulti(vMin, vMax) {
    var vMinArr = Array.isArray(vMin) ? vMin : [vMin];
    var vMaxArr = Array.isArray(vMax) ? vMax : [vMax];

    if (vMinArr.length === vMaxArr.length) {
      return vMinArr.map(function (v, i) {
        return [v, vMaxArr[i]];
      });
    }

    var max = Math.max(vMinArr.length, vMaxArr.length);
    return Array(max).map(function (_, i) {
      return [vMinArr[i % vMinArr.length], vMaxArr[i % vMaxArr.length]];
    });
  }

  function resolveOption(val, index) {
    if (!Array.isArray(val)) {
      return val;
    }

    return val[index % val.length];
  }

  function calcuateHalfSize(total, view, i) {
    var ratio = resolveOption(view.errorBarWhiskerRatio, i);

    if (total != null && ratio > 0) {
      return total * ratio * 0.5;
    }

    var size = resolveOption(view.errorBarWhiskerSize, i);
    return size * 0.5;
  }
  /**
   * @param {number} vMin
   * @param {number} vMax
   * @param {CanvasRenderingContext2D} ctx
   */


  function drawErrorBarVertical(view, vMin, vMax, ctx) {
    ctx.save();
    ctx.translate(view.x, 0);

    if (vMin == null) {
      vMin = view.y;
    }

    if (vMax == null) {
      vMax = view.y;
    }

    var bars = resolveMulti(vMin, vMax);
    bars.reverse().forEach(function (_ref, j) {
      var _ref2 = _slicedToArray(_ref, 2),
          mi = _ref2[0],
          ma = _ref2[1];

      var i = bars.length - j - 1;
      var halfWidth = calcuateHalfSize(view.width, view, i); // center line

      ctx.lineWidth = resolveOption(view.errorBarLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarColor, i);
      ctx.beginPath();
      ctx.moveTo(0, mi);
      ctx.lineTo(0, ma);
      ctx.stroke(); // whisker

      ctx.lineWidth = resolveOption(view.errorBarWhiskerLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarWhiskerColor, i);
      ctx.beginPath();
      ctx.moveTo(-halfWidth, mi);
      ctx.lineTo(halfWidth, mi);
      ctx.moveTo(-halfWidth, ma);
      ctx.lineTo(halfWidth, ma);
      ctx.stroke();
    });
    ctx.restore();
  }
  /**
   * @param {number} vMin
   * @param {number} vMax
   * @param {CanvasRenderingContext2D} ctx
   */


  function drawErrorBarHorizontal(view, vMin, vMax, ctx) {
    ctx.save();
    ctx.translate(0, view.y);

    if (vMin == null) {
      vMin = view.x;
    }

    if (vMax == null) {
      vMax = view.x;
    }

    var bars = resolveMulti(vMin, vMax);
    bars.reverse().forEach(function (_ref3, j) {
      var _ref4 = _slicedToArray(_ref3, 2),
          mi = _ref4[0],
          ma = _ref4[1];

      var i = bars.length - j - 1;
      var halfHeight = calcuateHalfSize(view.height, view, i); // center line

      ctx.lineWidth = resolveOption(view.errorBarLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarColor, i);
      ctx.beginPath();
      ctx.moveTo(mi, 0);
      ctx.lineTo(ma, 0);
      ctx.stroke(); // whisker

      ctx.lineWidth = resolveOption(view.errorBarWhiskerLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarWhiskerColor, i);
      ctx.beginPath();
      ctx.moveTo(mi, -halfHeight);
      ctx.lineTo(mi, halfHeight);
      ctx.moveTo(ma, -halfHeight);
      ctx.lineTo(ma, halfHeight);
      ctx.stroke();
    });
    ctx.restore();
  }

  function renderErrorBar(view, ctx) {
    if (view.xMin != null || view.xMax != null) {
      drawErrorBarHorizontal(view, view.xMin, view.xMax, ctx);
    }

    if (view.yMin != null || view.yMax != null) {
      drawErrorBarVertical(view, view.yMin, view.yMax, ctx);
    }
  }
  /**
   * @param {number} vMin
   * @param {number} vMax
   * @param {CanvasRenderingContext2D} ctx
   */

  function drawErrorBarArc(view, vMin, vMax, ctx) {
    ctx.save();
    ctx.translate(view.x, view.y); // move to center

    if (vMin == null) {
      vMin = view.outerRadius;
    }

    if (vMax == null) {
      vMax = view.outerRadius;
    }

    var angle = (view.startAngle + view.endAngle) / 2;
    var cosAngle = Math.cos(angle);
    var sinAngle = Math.sin(angle); // perpendicular

    var v = {
      x: -sinAngle,
      y: cosAngle
    };
    var length = Math.sqrt(v.x * v.x + v.y * v.y);
    v.x /= length;
    v.y /= length;
    var bars = resolveMulti(vMin, vMax);
    bars.reverse().forEach(function (_ref5, j) {
      var _ref6 = _slicedToArray(_ref5, 2),
          mi = _ref6[0],
          ma = _ref6[1];

      var i = bars.length - j - 1;
      var minCos = mi * cosAngle;
      var minSin = mi * sinAngle;
      var maxCos = ma * cosAngle;
      var maxSin = ma * sinAngle;
      var halfHeight = calcuateHalfSize(null, view, i);
      var eX = v.x * halfHeight;
      var eY = v.y * halfHeight; // center line

      ctx.lineWidth = resolveOption(view.errorBarLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarColor, i);
      ctx.beginPath();
      ctx.moveTo(minCos, minSin);
      ctx.lineTo(maxCos, maxSin);
      ctx.stroke(); // whisker

      ctx.lineWidth = resolveOption(view.errorBarWhiskerLineWidth, i);
      ctx.strokeStyle = resolveOption(view.errorBarWhiskerColor, i);
      ctx.beginPath();
      ctx.moveTo(minCos + eX, minSin + eY);
      ctx.lineTo(minCos - eX, minSin - eY);
      ctx.moveTo(maxCos + eX, maxSin + eY);
      ctx.lineTo(maxCos - eX, maxSin - eY);
      ctx.stroke();
    });
    ctx.restore();
  }

  function renderErrorBarArc(view, ctx) {
    if (view.yMin != null || view.yMax != null) {
      drawErrorBarArc(view, view.yMin, view.yMax, ctx);
    }
  }

  Chart.defaults.global.elements.rectangleWithErrorBar = _objectSpread2({}, Chart.defaults.global.elements.rectangle, {}, defaults);
  var RectangleWithErrorBar = Chart.elements.RectangleWithErrorBar = Chart.elements.Rectangle.extend({
    transition: function transition(ease) {
      var startBak = transitionErrorBarHelper(this._start);
      var r = Chart.elements.Rectangle.prototype.transition.call(this, ease);
      var model = this._model;
      var start = this._start;
      var view = this._view; // No animation -> No Transition

      if (!model || ease === 1) {
        return r;
      }

      transitionErrorBar(start, startBak, view, model, ease);
      return r;
    },
    draw: function draw() {
      Chart.elements.Rectangle.prototype.draw.call(this);
      renderErrorBar(this._view, this._chart.ctx);
    }
  });

  Chart.defaults.global.elements.pointWithErrorBar = _objectSpread2({}, Chart.defaults.global.elements.point, {}, defaults);
  var PointWithErrorBar = Chart.elements.PointWithErrorBar = Chart.elements.Point.extend({
    transition: function transition(ease) {
      var startBak = transitionErrorBarHelper(this._start);
      var r = Chart.elements.Point.prototype.transition.call(this, ease);
      var model = this._model;
      var start = this._start;
      var view = this._view; // No animation -> No Transition

      if (!model || ease === 1) {
        return r;
      }

      transitionErrorBar(start, startBak, view, model, ease);
      return r;
    },
    draw: function draw() {
      Chart.elements.Point.prototype.draw.call(this);
      renderErrorBar(this._view, this._chart.ctx);
    }
  });

  Chart.defaults.global.elements.arcWithErrorBar = _objectSpread2({}, Chart.defaults.global.elements.arc, {}, defaults);
  var ArcWithErrorBar = Chart.elements.ArcWithErrorBar = Chart.elements.Arc.extend({
    transition: function transition(ease) {
      var startBak = transitionErrorBarHelper(this._start);
      var r = Chart.elements.Arc.prototype.transition.call(this, ease);
      var model = this._model;
      var start = this._start;
      var view = this._view; // No animation -> No Transition

      if (!model || ease === 1) {
        return r;
      }

      transitionErrorBar(start, startBak, view, model, ease);
      return r;
    },
    draw: function draw() {
      Chart.elements.Arc.prototype.draw.call(this);
      renderErrorBarArc(this._view, this._chart.ctx);
    }
  });

  function calculateScale(model, data, scale, horizontal, reset) {
    var keys = modelKeys(horizontal);
    var base = scale.getBasePixel();
    keys.forEach(function (key) {
      var v = data[key];

      if (Array.isArray(v)) {
        model[key] = v.map(function (d) {
          return reset ? base : scale.getPixelForValue(d);
        });
      } else if (typeof v === 'number') {
        model[key] = reset ? base : scale.getPixelForValue(v);
      }
    });
  }

  function calculateErrorBarValuesPixels(controller, model, index, reset) {
    var data = controller.getDataset().data[index];

    if (!data) {
      return;
    }

    var scale = controller._getValueScale();

    calculateScale(model, data, scale, scale.isHorizontal(), reset);
  }
  function calculateErrorBarValuesPixelsScatter(controller, model, index, reset) {
    var data = controller.getDataset().data[index];

    if (!data) {
      return;
    }

    var meta = controller.getMeta();
    calculateScale(model, data, controller.getScaleForId(meta.xAxisID), true, reset);
    calculateScale(model, data, controller.getScaleForId(meta.yAxisID), false, reset);
  }
  function calculateErrorBarValuesPixelsPolar(controller, arc, model, index, reset) {
    var data = controller.getDataset().data[index];

    if (!data) {
      return;
    }

    var chart = controller.chart;
    var scale = chart.scale;
    var animationOpts = chart.options.animation;

    var toAngle = function toAngle(v) {
      var valueRadius = scale.getDistanceFromCenterForValue(v);
      var resetRadius = animationOpts.animateScale ? 0 : valueRadius;
      return reset ? resetRadius : arc.hidden ? 0 : valueRadius;
    };

    modelKeys(false).forEach(function (key) {
      // y variant
      var v = data[key];

      if (Array.isArray(v)) {
        model[key] = v.map(toAngle);
      } else if (typeof v === 'number') {
        model[key] = toAngle(v);
      }
    });
  }

  function reverseOrder(v) {
    return Array.isArray(v) ? v.slice().reverse() : v;
  }

  function generateTooltip(horizontal) {
    var _this = this;

    var keys = modelKeys(horizontal);
    return function (item, data) {
      var base = Chart.defaults.global.tooltips.callbacks.label.call(_this, item, data);
      var v = data.datasets[item.datasetIndex].data[item.index];

      if (v == null || keys.every(function (k) {
        return v[k] == null;
      })) {
        return base;
      }

      return "".concat(base, " (").concat(reverseOrder(v[keys[0]]), " .. ").concat(v[keys[1]], ")");
    };
  }
  function generateTooltipScatter(item, data) {
    var v = data.datasets[item.datasetIndex].data[item.index];

    var subLabel = function subLabel(base, horizontal) {
      var keys = modelKeys(horizontal);

      if (v == null || keys.every(function (k) {
        return v[k] == null;
      })) {
        return base;
      }

      return "".concat(base, " [").concat(reverseOrder(v[keys[0]]), " .. ").concat(v[keys[1]], "]");
    };

    return "(".concat(subLabel(item.xLabel, true), ", ").concat(subLabel(item.yLabel, false), ")");
  }
  function generateTooltipPolar(item, data) {
    var base = Chart.defaults.polarArea.tooltips.callbacks.label.call(this, item, data);
    var v = data.datasets[item.datasetIndex].data[item.index];
    var keys = modelKeys(false);

    if (v == null || keys.every(function (k) {
      return v[k] == null;
    })) {
      return base;
    }

    return "".concat(base, " [").concat(reverseOrder(v[keys[0]]), " .. ").concat(v[keys[1]], "]");
  }

  var defaults$1 = {
    scales: {
      yAxes: [{
        type: 'linearWithErrorBars'
      }]
    },
    tooltips: {
      callbacks: {
        label: generateTooltip(false)
      }
    }
  };
  var horizontalDefaults = {
    scales: {
      xAxes: [{
        type: 'linearWithErrorBars'
      }]
    },
    tooltips: {
      callbacks: {
        label: generateTooltip(true)
      }
    }
  };
  Chart.defaults.barWithErrorBars = Chart.helpers.configMerge(Chart.defaults.bar, defaults$1);
  Chart.defaults.horizontalBarWithErrorBars = Chart.helpers.configMerge(Chart.defaults.horizontalBar, horizontalDefaults);

  if (Chart.defaults.global.datasets && Chart.defaults.global.datasets.bar) {
    Chart.defaults.global.datasets.barWithErrorBars = _objectSpread2({}, Chart.defaults.global.datasets.bar);
  }

  if (Chart.defaults.global.datasets && Chart.defaults.global.datasets.horizontalBar) {
    Chart.defaults.global.datasets.horizontalBarWithErrorBars = _objectSpread2({}, Chart.defaults.global.datasets.horizontalBar);
  }

  var barWithErrorBars = {
    dataElementType: Chart.elements.RectangleWithErrorBar,
    _elementOptions: function _elementOptions() {
      return this.chart.options.elements.rectangleWithErrorBar;
    },

    /**
     * @private
     */
    _updateElementGeometry: function _updateElementGeometry(elem, index, reset) {
      var _Chart$controllers$ba;

      updateErrorBarElement(this, elem, index);

      for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }

      (_Chart$controllers$ba = Chart.controllers.bar.prototype._updateElementGeometry).call.apply(_Chart$controllers$ba, [this, elem, index, reset].concat(args));

      calculateErrorBarValuesPixels(this, elem._model, index, reset);
    }
  };
  /**
   * This class is based off controller.bar.js from the upstream Chart.js library
   */

  var BarWithErrorBars = Chart.controllers.barWithErrorBars = Chart.controllers.bar.extend(barWithErrorBars);
  var HorizontalBarWithErrorBars = Chart.controllers.horizontalBarWithErrorBars = Chart.controllers.horizontalBar.extend(barWithErrorBars);

  var defaults$2 = {
    scales: {
      yAxes: [{
        type: 'linearWithErrorBars'
      }]
    },
    tooltips: {
      callbacks: {
        label: generateTooltip(false)
      }
    }
  };
  Chart.defaults.lineWithErrorBars = Chart.helpers.configMerge(Chart.defaults.line, defaults$2);

  if (Chart.defaults.global.datasets && Chart.defaults.global.datasets.line) {
    Chart.defaults.global.datasets.lineWithErrorBars = _objectSpread2({}, Chart.defaults.global.datasets.line);
  }

  var lineWithErrorBars = {
    dataElementType: Chart.elements.PointWithErrorBar,
    _elementOptions: function _elementOptions() {
      return this.chart.options.elements.pointWithErrorBar;
    },
    updateElement: function updateElement(point, index, reset) {
      var _Chart$controllers$li;

      for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }

      (_Chart$controllers$li = Chart.controllers.line.prototype.updateElement).call.apply(_Chart$controllers$li, [this, point, index, reset].concat(args));

      updateErrorBarElement(this, point, index);
      calculateErrorBarValuesPixelsScatter(this, point._model, index, reset);
    }
  };
  var LineWithErrorBars = Chart.controllers.lineWithErrorBars = Chart.controllers.line.extend(lineWithErrorBars);

  var defaults$3 = {
    scales: {
      xAxes: [{
        type: 'linearWithErrorBars'
      }],
      yAxes: [{
        type: 'linearWithErrorBars'
      }]
    },
    tooltips: {
      callbacks: {
        label: generateTooltipScatter
      }
    }
  };
  Chart.defaults.scatterWithErrorBars = Chart.helpers.configMerge(Chart.defaults.scatter, defaults$3);

  if (Chart.defaults.global.datasets && Chart.defaults.global.datasets.scatter) {
    Chart.defaults.global.datasets.scatterWithErrorBars = _objectSpread2({}, Chart.defaults.global.datasets.scatter);
  }

  var ScatterithErrorBars = Chart.controllers.scatterWithErrorBars = LineWithErrorBars;

  var defaults$4 = {
    scale: {
      type: 'radialLinearWithErrorBars'
    },
    tooltips: {
      callbacks: {
        label: generateTooltipPolar
      }
    }
  };
  Chart.defaults.polarAreaWithErrorBars = Chart.helpers.configMerge(Chart.defaults.polarArea, defaults$4);

  if (Chart.defaults.global.datasets && Chart.defaults.global.datasets.polarArea) {
    Chart.defaults.global.datasets.polarAreaWithErrorBars = _objectSpread2({}, Chart.defaults.global.datasets.polarArea);
  }

  var superClass = Chart.controllers.polarArea.prototype;
  var polarAreaWithErrorBars = {
    dataElementType: Chart.elements.ArcWithErrorBar,
    _elementOptions: function _elementOptions() {
      return this.chart.options.elements.arcWithErrorBar;
    },
    _getPatchedDataset: function _getPatchedDataset() {
      var dataset = superClass.getDataset.call(this);
      return _objectSpread2({}, dataset, {
        // inline d.v
        data: dataset.data.map(function (d) {
          return d != null && typeof d.y === 'number' ? d.y : d;
        })
      });
    },
    _withPatching: function _withPatching(f) {
      try {
        this.getDataset = this._getPatchedDataset.bind(this);
        return f();
      } finally {
        delete this.getDataset;
      }
    },
    updateElement: function updateElement(arc, index, reset) {
      var _this = this;

      for (var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }

      this._withPatching(function () {
        var _superClass$updateEle;

        return (_superClass$updateEle = superClass.updateElement).call.apply(_superClass$updateEle, [_this, arc, index, reset].concat(args));
      });

      updateErrorBarElement(this, arc, index);
      calculateErrorBarValuesPixelsPolar(this, arc, arc._model, index, reset);
    },
    countVisibleElements: function countVisibleElements() {
      var _this2 = this;

      return this._withPatching(function () {
        return superClass.countVisibleElements.call(_this2);
      });
    },
    _computeAngle: function _computeAngle(index) {
      var _this3 = this;

      return this._withPatching(function () {
        return superClass._computeAngle.call(_this3, index);
      });
    }
  };
  var PolarAreaWithErrorBars = Chart.controllers.polarAreaWithErrorBars = Chart.controllers.polarArea.extend(polarAreaWithErrorBars);

  var linearWithErrorBarsOptions = Chart.helpers.merge({}, [Chart.scaleService.getScaleDefaults('linear')]);
  var LinearWithErrorBarsScale = Chart.scaleService.getScaleConstructor('linear').extend({
    determineDataLimits: function determineDataLimits() {
      commonDataLimits.call(this, this.isHorizontal()); // Common base implementation to handle ticks.min, ticks.max, ticks.beginAtZero

      this.handleTickRangeOptions();
    }
  });
  Chart.scaleService.registerScaleType('linearWithErrorBars', LinearWithErrorBarsScale, linearWithErrorBarsOptions);

  var logarithmicWithErrorBarsOptions = Chart.helpers.merge({}, [Chart.scaleService.getScaleDefaults('logarithmic')]);
  var LogarithmicWithErrorBarsScale = Chart.scaleService.getScaleConstructor('logarithmic').extend({
    determineDataLimits: function determineDataLimits() {
      var _this = this;

      // Add whitespace around bars. Axis shouldn't go exactly from min to max
      this.minNotZero = null;
      commonDataLimits.call(this, this.isHorizontal(), function (v, isHorizontal) {
        var value = isHorizontal ? v.xMin : v.yMin;

        if (typeof value === 'number' && value !== 0 && (_this.minNotZero === null || value < _this.minNotZero)) {
          _this.minNotZero = value;
        }
      }); // Common base implementation to handle ticks.min, ticks.max

      this.handleTickRangeOptions();
    }
  });
  Chart.scaleService.registerScaleType('logarithmicWithErrorBars', LogarithmicWithErrorBarsScale, logarithmicWithErrorBarsOptions);

  var radialLinearWithErrorBarsOptions = Chart.helpers.merge({}, [Chart.scaleService.getScaleDefaults('radialLinear')]);
  var RadialLinearWithErrorBarsScale = Chart.scaleService.getScaleConstructor('radialLinear').extend({
    determineDataLimits: function determineDataLimits() {
      commonDataLimits.call(this, false, null, true);
      this.handleTickRangeOptions();
    }
  });
  Chart.scaleService.registerScaleType('radialLinearWithErrorBars', RadialLinearWithErrorBarsScale, radialLinearWithErrorBarsOptions);

  exports.ArcWithErrorBar = ArcWithErrorBar;
  exports.BarWithErrorBars = BarWithErrorBars;
  exports.HorizontalBarWithErrorBars = HorizontalBarWithErrorBars;
  exports.LineWithErrorBars = LineWithErrorBars;
  exports.LinearWithErrorBarsScale = LinearWithErrorBarsScale;
  exports.LogarithmicWithErrorBarsScale = LogarithmicWithErrorBarsScale;
  exports.PointWithErrorBar = PointWithErrorBar;
  exports.PolarAreaWithErrorBars = PolarAreaWithErrorBars;
  exports.RadialLinearWithErrorBarsScale = RadialLinearWithErrorBarsScale;
  exports.RectangleWithErrorBar = RectangleWithErrorBar;
  exports.ScatterithErrorBars = ScatterithErrorBars;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
