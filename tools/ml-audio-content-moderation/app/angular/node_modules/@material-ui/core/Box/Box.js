"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unstable_Box = exports.styleFunction = void 0;

var _borders = _interopRequireDefault(require("@material-ui/system/borders"));

var _compose = _interopRequireDefault(require("@material-ui/system/compose"));

var _styled = _interopRequireDefault(require("@material-ui/styles/styled"));

var _display = _interopRequireDefault(require("@material-ui/system/display"));

var _flexbox = _interopRequireDefault(require("@material-ui/system/flexbox"));

var _palette = _interopRequireDefault(require("@material-ui/system/palette"));

var _positions = _interopRequireDefault(require("@material-ui/system/positions"));

var _shadows = _interopRequireDefault(require("@material-ui/system/shadows"));

var _sizing = _interopRequireDefault(require("@material-ui/system/sizing"));

var _spacing = _interopRequireDefault(require("@material-ui/system/spacing"));

var _typography = _interopRequireDefault(require("@material-ui/system/typography"));

var _css = _interopRequireDefault(require("@material-ui/system/css"));

/* eslint-disable camelcase */
var styleFunction = (0, _css.default)((0, _compose.default)(_borders.default, _display.default, _flexbox.default, _positions.default, _palette.default, _shadows.default, _sizing.default, _spacing.default, _typography.default));
/**
 * @ignore - do not document.
 */

exports.styleFunction = styleFunction;
var unstable_Box = (0, _styled.default)('div')(styleFunction, {
  name: 'MuiBox'
});
exports.unstable_Box = unstable_Box;