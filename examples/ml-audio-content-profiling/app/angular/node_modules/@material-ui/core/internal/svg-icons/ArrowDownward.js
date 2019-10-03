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
  d: "M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"
});

/**
 * @ignore - internal component.
 */
var ArrowDownward = function ArrowDownward(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

ArrowDownward = (0, _pure.default)(ArrowDownward);
ArrowDownward.muiName = 'SvgIcon';
var _default = ArrowDownward;
exports.default = _default;