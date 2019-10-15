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
  d: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-2 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"
});

/**
 * @ignore - internal component.
 */
var CheckCircle = function CheckCircle(props) {
  return _react.default.createElement(_SvgIcon.default, props, _ref);
};

CheckCircle = (0, _pure.default)(CheckCircle);
CheckCircle.muiName = 'SvgIcon';
var _default = CheckCircle;
exports.default = _default;