"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.bgcolor = exports.color = void 0;

var _style = _interopRequireDefault(require("./style"));

var _compose = _interopRequireDefault(require("./compose"));

var color = (0, _style.default)({
  prop: 'color',
  themeKey: 'palette'
});
exports.color = color;
var bgcolor = (0, _style.default)({
  prop: 'bgcolor',
  cssProperty: 'backgroundColor',
  themeKey: 'palette'
});
exports.bgcolor = bgcolor;
var palette = (0, _compose.default)(color, bgcolor);
var _default = palette;
exports.default = _default;