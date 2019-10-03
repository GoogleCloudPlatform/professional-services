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
  d: "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
});

/**
 * @ignore - internal component.
 */
var CheckBox = function CheckBox(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

CheckBox = (0, _pure.default)(CheckBox);
CheckBox.muiName = 'SvgIcon';
var _default = CheckBox;
exports.default = _default;