"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _pure = _interopRequireDefault(require("recompose/pure"));

var _SvgIcon = _interopRequireDefault(require("../../SvgIcon"));

var _ref = _react.default.createElement("path", {
  d: "M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"
});

/**
 * @ignore - internal component.
 */
var KeyboardArrowRight = function KeyboardArrowRight(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

KeyboardArrowRight = (0, _pure.default)(KeyboardArrowRight);
KeyboardArrowRight.muiName = 'SvgIcon';
var _default = KeyboardArrowRight;
exports.default = _default;