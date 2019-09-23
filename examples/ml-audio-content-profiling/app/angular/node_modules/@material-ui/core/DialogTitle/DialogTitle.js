"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Typography = _interopRequireDefault(require("../Typography"));

var styles = {
  /* Styles applied to the root element. */
  root: {
    margin: 0,
    padding: '24px 24px 20px',
    flex: '0 0 auto'
  }
};
exports.styles = styles;

function DialogTitle(props) {
  var children = props.children,
      classes = props.classes,
      className = props.className,
      disableTypography = props.disableTypography,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "disableTypography"]);
  return _react.default.createElement("div", (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className)
  }, other), disableTypography ? children : _react.default.createElement(_Typography.default, {
    variant: "title",
    internalDeprecatedVariant: true
  }, children));
}

process.env.NODE_ENV !== "production" ? DialogTitle.propTypes = {
  /**
   * The content of the component.
   */
  children: _propTypes.default.node.isRequired,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * If `true`, the children won't be wrapped by a typography component.
   * For instance, this can be useful to render an h4 instead of the default h2.
   */
  disableTypography: _propTypes.default.bool
} : void 0;
DialogTitle.defaultProps = {
  disableTypography: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiDialogTitle'
})(DialogTitle);

exports.default = _default;