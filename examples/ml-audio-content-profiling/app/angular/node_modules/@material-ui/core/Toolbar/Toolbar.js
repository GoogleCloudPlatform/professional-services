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

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },

    /* Styles applied to the root element if `disableGutters={false}`. */
    gutters: theme.mixins.gutters(),

    /* Styles applied to the root element if `variant="regular"`. */
    regular: theme.mixins.toolbar,

    /* Styles applied to the root element if `variant="dense"`. */
    dense: {
      minHeight: 48
    }
  };
};

exports.styles = styles;

function Toolbar(props) {
  var children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      disableGutters = props.disableGutters,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "disableGutters", "variant"]);
  var className = (0, _classnames.default)(classes.root, classes[variant], (0, _defineProperty2.default)({}, classes.gutters, !disableGutters), classNameProp);
  return _react.default.createElement("div", (0, _extends2.default)({
    className: className
  }, other), children);
}

process.env.NODE_ENV !== "production" ? Toolbar.propTypes = {
  /**
   * Toolbar children, usually a mixture of `IconButton`, `Button` and `Typography`.
   */
  children: _propTypes.default.node,

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
   * If `true`, disables gutter padding.
   */
  disableGutters: _propTypes.default.bool,

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['regular', 'dense'])
} : void 0;
Toolbar.defaultProps = {
  disableGutters: false,
  variant: 'regular'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiToolbar'
})(Toolbar);

exports.default = _default;