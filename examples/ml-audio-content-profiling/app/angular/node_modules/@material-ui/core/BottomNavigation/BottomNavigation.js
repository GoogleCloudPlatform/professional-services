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

var _utils = require("@material-ui/utils");

var _warning = _interopRequireDefault(require("warning"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'flex',
      justifyContent: 'center',
      height: 56,
      backgroundColor: theme.palette.background.paper
    }
  };
};

exports.styles = styles;

function BottomNavigation(props) {
  var childrenProp = props.children,
      classes = props.classes,
      classNameProp = props.className,
      Component = props.component,
      onChange = props.onChange,
      showLabels = props.showLabels,
      value = props.value,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "component", "onChange", "showLabels", "value"]);
  var className = (0, _classnames.default)(classes.root, classNameProp);

  var children = _react.default.Children.map(childrenProp, function (child, childIndex) {
    if (!_react.default.isValidElement(child)) {
      return null;
    }

    process.env.NODE_ENV !== "production" ? (0, _warning.default)(child.type !== _react.default.Fragment, ["Material-UI: the BottomNavigation component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n')) : void 0;
    var childValue = child.props.value === undefined ? childIndex : child.props.value;
    return _react.default.cloneElement(child, {
      selected: childValue === value,
      showLabel: child.props.showLabel !== undefined ? child.props.showLabel : showLabels,
      value: childValue,
      onChange: onChange
    });
  });

  return _react.default.createElement(Component, (0, _extends2.default)({
    className: className
  }, other), children);
}

process.env.NODE_ENV !== "production" ? BottomNavigation.propTypes = {
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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * Callback fired when the value changes.
   *
   * @param {object} event The event source of the callback
   * @param {any} value We default to the index of the child
   */
  onChange: _propTypes.default.func,

  /**
   * If `true`, all `BottomNavigationAction`s will show their labels.
   * By default, only the selected `BottomNavigationAction` will show its label.
   */
  showLabels: _propTypes.default.bool,

  /**
   * The value of the currently selected `BottomNavigationAction`.
   */
  value: _propTypes.default.any
} : void 0;
BottomNavigation.defaultProps = {
  component: 'div',
  showLabels: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiBottomNavigation'
})(BottomNavigation);

exports.default = _default;