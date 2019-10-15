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

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _colorManipulator = require("../styles/colorManipulator");

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      height: 1,
      margin: 0,
      // Reset browser default style.
      border: 'none',
      flexShrink: 0,
      backgroundColor: theme.palette.divider
    },

    /* Styles applied to the root element if `absolute={true}`. */
    absolute: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%'
    },

    /* Styles applied to the root element if `variant="inset"`. */
    inset: {
      marginLeft: 72
    },

    /* Styles applied to the root element if `light={true}`. */
    light: {
      backgroundColor: (0, _colorManipulator.fade)(theme.palette.divider, 0.08)
    },

    /* Styles applied to the root element if `variant="middle"`. */
    middle: {
      marginLeft: theme.spacing.unit * 2,
      marginRight: theme.spacing.unit * 2
    }
  };
};

exports.styles = styles;

function Divider(props) {
  var _classNames;

  var absolute = props.absolute,
      classes = props.classes,
      className = props.className,
      Component = props.component,
      inset = props.inset,
      light = props.light,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["absolute", "classes", "className", "component", "inset", "light", "variant"]);
  return _react.default.createElement(Component, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.inset, inset || variant === 'inset'), (0, _defineProperty2.default)(_classNames, classes.middle, variant === 'middle'), (0, _defineProperty2.default)(_classNames, classes.absolute, absolute), (0, _defineProperty2.default)(_classNames, classes.light, light), _classNames), className)
  }, other));
}

process.env.NODE_ENV !== "production" ? Divider.propTypes = {
  /**
   * Absolutely position the element.
   */
  absolute: _propTypes.default.bool,

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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * If `true`, the divider will be indented.
   * __WARNING__: `inset` is deprecated.
   * Instead use `variant="inset"`.
   */
  inset: (0, _utils.chainPropTypes)(_propTypes.default.bool, function (props) {
    /* istanbul ignore if */
    if (props.inset) {
      return new Error('Material-UI: you are using the deprecated `inset` property ' + 'that will be removed in the next major release. The property `variant="inset"` ' + 'is equivalent and should be used instead.');
    }

    return null;
  }),

  /**
   * If `true`, the divider will have a lighter color.
   */
  light: _propTypes.default.bool,

  /**
   *  The variant to use.
   */
  variant: _propTypes.default.oneOf(['fullWidth', 'inset', 'middle'])
} : void 0;
Divider.defaultProps = {
  absolute: false,
  component: 'hr',
  light: false,
  variant: 'fullWidth'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiDivider'
})(Divider);

exports.default = _default;