"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _ListItem = _interopRequireDefault(require("../ListItem"));

// @inheritedComponent ListItem
var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: (0, _extends2.default)({}, theme.typography.subheading, {
      height: 24,
      boxSizing: 'content-box',
      width: 'auto',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      '&$selected': {}
    }),

    /* Styles applied to the root element if `disableGutters={false}`. */
    gutters: {
      paddingLeft: 16,
      paddingRight: 16
    },

    /* Styles applied to the root element if `selected={true}`. */
    selected: {}
  };
};

exports.styles = styles;

function MenuItem(props) {
  var _classNames;

  var classes = props.classes,
      className = props.className,
      component = props.component,
      disableGutters = props.disableGutters,
      role = props.role,
      selected = props.selected,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "component", "disableGutters", "role", "selected"]);
  return _react.default.createElement(_ListItem.default, (0, _extends2.default)({
    button: true,
    role: role,
    tabIndex: -1,
    component: component,
    selected: selected,
    disableGutters: disableGutters,
    className: (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.selected, selected), (0, _defineProperty2.default)(_classNames, classes.gutters, !disableGutters), _classNames), className)
  }, other));
}

process.env.NODE_ENV !== "production" ? MenuItem.propTypes = {
  /**
   * Menu item contents.
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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * If `true`, the left and right padding is removed.
   */
  disableGutters: _propTypes.default.bool,

  /**
   * @ignore
   */
  role: _propTypes.default.string,

  /**
   * @ignore
   */
  selected: _propTypes.default.bool
} : void 0;
MenuItem.defaultProps = {
  component: 'li',
  disableGutters: false,
  role: 'menuitem'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiMenuItem'
})(MenuItem);

exports.default = _default;