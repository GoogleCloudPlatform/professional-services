"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Typography = _interopRequireDefault(require("../Typography"));

// @inheritedComponent Typography
var styles = {
  /* Styles applied to the root element. */
  root: {
    // Should use variant="body1" in v4
    lineHeight: 1.5
  }
};
exports.styles = styles;

function DialogContentText(props) {
  return _react.default.createElement(_Typography.default, (0, _extends2.default)({
    component: "p",
    internalDeprecatedVariant: true,
    variant: "subheading",
    color: "textSecondary"
  }, props));
}

process.env.NODE_ENV !== "production" ? DialogContentText.propTypes = {
  /**
   * The content of the component.
   */
  children: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired
} : void 0;

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiDialogContentText'
})(DialogContentText);

exports.default = _default;