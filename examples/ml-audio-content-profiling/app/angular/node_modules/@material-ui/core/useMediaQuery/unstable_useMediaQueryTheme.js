"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _styles = require("@material-ui/styles");

var _unstable_useMediaQuery = _interopRequireDefault(require("./unstable_useMediaQuery"));

var _getThemeProps = _interopRequireDefault(require("../styles/getThemeProps"));

/* eslint-disable camelcase */
function unstable_useMediaQueryTheme(query, options) {
  var theme = (0, _styles.useTheme)();
  var props = (0, _getThemeProps.default)({
    theme: theme,
    name: 'MuiUseMediaQuery',
    props: {}
  });
  return (0, _unstable_useMediaQuery.default)(query, (0, _extends2.default)({}, props, options));
}

var _default = unstable_useMediaQueryTheme;
exports.default = _default;