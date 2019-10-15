"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _warning = _interopRequireDefault(require("warning"));

var _createBreakpoints = require("../styles/createBreakpoints");

var _helpers = require("../utils/helpers");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = function styles(theme) {
  var hidden = {
    display: 'none'
  };
  return _createBreakpoints.keys.reduce(function (acc, key) {
    acc["only".concat((0, _helpers.capitalize)(key))] = (0, _defineProperty2.default)({}, theme.breakpoints.only(key), hidden);
    acc["".concat(key, "Up")] = (0, _defineProperty2.default)({}, theme.breakpoints.up(key), hidden);
    acc["".concat(key, "Down")] = (0, _defineProperty2.default)({}, theme.breakpoints.down(key), hidden);
    return acc;
  }, {});
};
/**
 * @ignore - internal component.
 */


function HiddenCss(props) {
  var children = props.children,
      classes = props.classes,
      className = props.className,
      lgDown = props.lgDown,
      lgUp = props.lgUp,
      mdDown = props.mdDown,
      mdUp = props.mdUp,
      only = props.only,
      smDown = props.smDown,
      smUp = props.smUp,
      xlDown = props.xlDown,
      xlUp = props.xlUp,
      xsDown = props.xsDown,
      xsUp = props.xsUp,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "lgDown", "lgUp", "mdDown", "mdUp", "only", "smDown", "smUp", "xlDown", "xlUp", "xsDown", "xsUp"]);
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(Object.keys(other).length === 0 || Object.keys(other).length === 1 && other.hasOwnProperty('ref'), "Material-UI: unsupported properties received ".concat(Object.keys(other).join(', '), " by `<Hidden />`.")) : void 0;
  var classNames = [];

  if (className) {
    classNames.push(className);
  }

  for (var i = 0; i < _createBreakpoints.keys.length; i += 1) {
    var breakpoint = _createBreakpoints.keys[i];
    var breakpointUp = props["".concat(breakpoint, "Up")];
    var breakpointDown = props["".concat(breakpoint, "Down")];

    if (breakpointUp) {
      classNames.push(classes["".concat(breakpoint, "Up")]);
    }

    if (breakpointDown) {
      classNames.push(classes["".concat(breakpoint, "Down")]);
    }
  }

  if (only) {
    var onlyBreakpoints = Array.isArray(only) ? only : [only];
    onlyBreakpoints.forEach(function (breakpoint) {
      classNames.push(classes["only".concat((0, _helpers.capitalize)(breakpoint))]);
    });
  }

  return _react.default.createElement("div", {
    className: classNames.join(' ')
  }, children);
}

process.env.NODE_ENV !== "production" ? HiddenCss.propTypes = {
  /**
   * The content of the component.
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
   * Specify which implementation to use.  'js' is the default, 'css' works better for
   * server-side rendering.
   */
  implementation: _propTypes.default.oneOf(['js', 'css']),

  /**
   * If true, screens this size and down will be hidden.
   */
  lgDown: _propTypes.default.bool,

  /**
   * If true, screens this size and up will be hidden.
   */
  lgUp: _propTypes.default.bool,

  /**
   * If true, screens this size and down will be hidden.
   */
  mdDown: _propTypes.default.bool,

  /**
   * If true, screens this size and up will be hidden.
   */
  mdUp: _propTypes.default.bool,

  /**
   * Hide the given breakpoint(s).
   */
  only: _propTypes.default.oneOfType([_propTypes.default.oneOf(['xs', 'sm', 'md', 'lg', 'xl']), _propTypes.default.arrayOf(_propTypes.default.oneOf(['xs', 'sm', 'md', 'lg', 'xl']))]),

  /**
   * If true, screens this size and down will be hidden.
   */
  smDown: _propTypes.default.bool,

  /**
   * If true, screens this size and up will be hidden.
   */
  smUp: _propTypes.default.bool,

  /**
   * If true, screens this size and down will be hidden.
   */
  xlDown: _propTypes.default.bool,

  /**
   * If true, screens this size and up will be hidden.
   */
  xlUp: _propTypes.default.bool,

  /**
   * If true, screens this size and down will be hidden.
   */
  xsDown: _propTypes.default.bool,

  /**
   * If true, screens this size and up will be hidden.
   */
  xsUp: _propTypes.default.bool
} : void 0;

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiPrivateHiddenCss'
})(HiddenCss);

exports.default = _default;