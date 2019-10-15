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
  d: "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
});

/**
 * @ignore - internal component.
 */
var CheckBoxOutlineBlank = function CheckBoxOutlineBlank(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

CheckBoxOutlineBlank = (0, _pure.default)(CheckBoxOutlineBlank);
CheckBoxOutlineBlank.muiName = 'SvgIcon';
var _default = CheckBoxOutlineBlank;
exports.default = _default;