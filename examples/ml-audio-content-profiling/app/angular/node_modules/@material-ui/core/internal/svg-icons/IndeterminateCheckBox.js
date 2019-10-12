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
  d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"
});

/**
 * @ignore - internal component.
 */
var IndeterminateCheckBox = function IndeterminateCheckBox(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

IndeterminateCheckBox = (0, _pure.default)(IndeterminateCheckBox);
IndeterminateCheckBox.muiName = 'SvgIcon';
var _default = IndeterminateCheckBox;
exports.default = _default;