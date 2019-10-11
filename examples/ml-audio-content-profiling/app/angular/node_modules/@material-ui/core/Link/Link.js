"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("@material-ui/utils");

var _classnames = _interopRequireDefault(require("classnames"));

var _helpers = require("../utils/helpers");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Typography = _interopRequireDefault(require("../Typography"));

// @inheritedComponent Typography
var styles = {
  /* Styles applied to the root element. */
  root: {},

  /* Styles applied to the root element if `underline="none"`. */
  underlineNone: {
    textDecoration: 'none'
  },

  /* Styles applied to the root element if `underline="hover"`. */
  underlineHover: {
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },

  /* Styles applied to the root element if `underline="always"`. */
  underlineAlways: {
    textDecoration: 'underline'
  },
  // Same reset as ButtonBase.root

  /* Styles applied to the root element if `component="button"`. */
  button: {
    position: 'relative',
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    // Reset default value
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
    border: 0,
    margin: 0,
    // Remove the margin in Safari
    borderRadius: 0,
    padding: 0,
    // Remove the padding in Firefox
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    '-moz-appearance': 'none',
    // Reset
    '-webkit-appearance': 'none',
    // Reset
    '&::-moz-focus-inner': {
      borderStyle: 'none' // Remove Firefox dotted outline.

    }
  }
};
exports.styles = styles;

function Link(props) {
  var block = props.block,
      children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      component = props.component,
      TypographyClasses = props.TypographyClasses,
      underline = props.underline,
      other = (0, _objectWithoutProperties2.default)(props, ["block", "children", "classes", "className", "component", "TypographyClasses", "underline"]);
  return _react.default.createElement(_Typography.default, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, (0, _defineProperty2.default)({}, classes.button, component === 'button'), classes["underline".concat((0, _helpers.capitalize)(underline))], classNameProp),
    classes: TypographyClasses,
    component: component,
    inline: !block
  }, other), children);
}

process.env.NODE_ENV !== "production" ? Link.propTypes = {
  /**
   *  Controls whether the link is inline or not. When `block` is true the link is not inline
   *  when `block` is false it is.
   */
  block: _propTypes.default.bool,

  /**
   * The content of the link.
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
   * The color of the link.
   */
  color: _propTypes.default.oneOf(['error', 'inherit', 'primary', 'secondary', 'textPrimary', 'textSecondary']),

  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * `classes` property applied to the [`Typography`](/api/typography/) element.
   */
  TypographyClasses: _propTypes.default.object,

  /**
   *  Controls when the link should have an underline.
   */
  underline: _propTypes.default.oneOf(['none', 'hover', 'always']),

  /**
   * Applies the theme typography styles.
   */
  variant: _propTypes.default.string
} : void 0;
Link.defaultProps = {
  block: false,
  color: 'primary',
  component: 'a',
  underline: 'hover',
  variant: 'inherit'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiLink'
})(Link);

exports.default = _default;