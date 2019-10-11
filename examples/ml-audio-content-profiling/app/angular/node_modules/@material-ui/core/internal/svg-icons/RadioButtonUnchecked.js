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
  d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
});

/**
 * @ignore - internal component.
 */
var RadioButtonUnchecked = function RadioButtonUnchecked(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

RadioButtonUnchecked = (0, _pure.default)(RadioButtonUnchecked);
RadioButtonUnchecked.muiName = 'SvgIcon';
var _default = RadioButtonUnchecked;
exports.default = _default;