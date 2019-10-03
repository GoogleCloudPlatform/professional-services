"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleBreakpoints = handleBreakpoints;
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _warning = _interopRequireDefault(require("warning"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _merge = _interopRequireDefault(require("./merge"));

// The breakpoint **start** at this value.
// For instance with the first breakpoint xs: [xs, sm[.
var values = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920
};
var defaultBreakpoints = {
  // Sorted ASC by size. That's important.
  // It can't be configured as it's used statically for propTypes.
  keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  up: function up(key) {
    return "@media (min-width:".concat(values[key], "px)");
  }
};

function handleBreakpoints(props, propValue, styleFromPropValue) {
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(props.theme, '@material-ui/system: you are calling a style function without a theme value.') : void 0;

  if (Array.isArray(propValue)) {
    var themeBreakpoints = props.theme.breakpoints || defaultBreakpoints;
    return propValue.reduce(function (acc, item, index) {
      acc[themeBreakpoints.up(themeBreakpoints.keys[index])] = styleFromPropValue(propValue[index]);
      return acc;
    }, {});
  }

  if ((0, _typeof2.default)(propValue) === 'object') {
    var _themeBreakpoints = props.theme.breakpoints || defaultBreakpoints;

    return Object.keys(propValue).reduce(function (acc, breakpoint) {
      acc[_themeBreakpoints.up(breakpoint)] = styleFromPropValue(propValue[breakpoint]);
      return acc;
    }, {});
  }

  var output = styleFromPropValue(propValue);
  return output;
}

function breakpoints(styleFunction) {
  var newStyleFunction = function newStyleFunction(props) {
    var base = styleFunction(props);
    var themeBreakpoints = props.theme.breakpoints || defaultBreakpoints;
    var extended = themeBreakpoints.keys.reduce(function (acc, key) {
      if (props[key]) {
        acc = acc || {};
        acc[themeBreakpoints.up(key)] = styleFunction((0, _extends2.default)({
          theme: props.theme
        }, props[key]));
      }

      return acc;
    }, null);
    return (0, _merge.default)(base, extended);
  };

  newStyleFunction.propTypes = process.env.NODE_ENV !== 'production' ? (0, _extends2.default)({}, styleFunction.propTypes, {
    xs: _propTypes.default.object,
    sm: _propTypes.default.object,
    md: _propTypes.default.object,
    lg: _propTypes.default.object,
    xl: _propTypes.default.object
  }) : {};
  newStyleFunction.filterProps = ['xs', 'sm', 'md', 'lg', 'xl'].concat((0, _toConsumableArray2.default)(styleFunction.filterProps));
  return newStyleFunction;
}

var _default = breakpoints;
exports.default = _default;