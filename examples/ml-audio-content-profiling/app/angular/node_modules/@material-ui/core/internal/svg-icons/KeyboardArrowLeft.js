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
  d: "M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"
});

/**
 * @ignore - internal component.
 */
var KeyboardArrowLeft = function KeyboardArrowLeft(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

KeyboardArrowLeft = (0, _pure.default)(KeyboardArrowLeft);
KeyboardArrowLeft.muiName = 'SvgIcon';
var _default = KeyboardArrowLeft;
exports.default = _default;