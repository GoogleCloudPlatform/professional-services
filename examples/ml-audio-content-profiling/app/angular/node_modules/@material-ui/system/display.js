"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.displayPrint = exports.displayRaw = void 0;

var _style = _interopRequireDefault(require("./style"));

var _compose = _interopRequireDefault(require("./compose"));

var displayRaw = (0, _style.default)({
  prop: 'display'
});
exports.displayRaw = displayRaw;
var displayPrint = (0, _style.default)({
  prop: 'displayPrint',
  cssProperty: false,
  transform: function transform(value) {
    return {
      '@media print': {
        display: value
      }
    };
  }
});
exports.displayPrint = displayPrint;

var _default = (0, _compose.default)(displayRaw, displayPrint);

exports.default = _default;