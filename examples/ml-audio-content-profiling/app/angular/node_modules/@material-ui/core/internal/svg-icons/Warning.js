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
  d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
});

/**
 * @ignore - internal component.
 */
var Warning = function Warning(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

Warning = (0, _pure.default)(Warning);
Warning.muiName = 'SvgIcon';
var _default = Warning;
exports.default = _default;