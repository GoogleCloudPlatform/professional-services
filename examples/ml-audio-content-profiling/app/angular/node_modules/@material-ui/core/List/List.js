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

var _ListContext = _interopRequireDefault(require("./ListContext"));

var styles = {
  /* Styles applied to the root element. */
  root: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    position: 'relative'
  },

  /* Styles applied to the root element if `disablePadding={false}`. */
  padding: {
    paddingTop: 8,
    paddingBottom: 8
  },

  /* Styles applied to the root element if `dense={true}` & `disablePadding={false}`. */
  dense: {
    paddingTop: 4,
    paddingBottom: 4
  },

  /* Styles applied to the root element if a `subheader` is provided. */
  subheader: {
    paddingTop: 0
  }
};
exports.styles = styles;

function List(props) {
  var _classNames;

  var children = props.children,
      classes = props.classes,
      className = props.className,
      Component = props.component,
      dense = props.dense,
      disablePadding = props.disablePadding,
      subheader = props.subheader,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "component", "dense", "disablePadding", "subheader"]);
  return _react.default.createElement(Component, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.dense, dense && !disablePadding), (0, _defineProperty2.default)(_classNames, classes.padding, !disablePadding), (0, _defineProperty2.default)(_classNames, classes.subheader, subheader), _classNames), className)
  }, other), _react.default.createElement(_ListContext.default.Provider, {
    value: {
      dense: dense
    }
  }, subheader, children));
}

process.env.NODE_ENV !== "production" ? List.propTypes = {
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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * If `true`, compact vertical padding designed for keyboard and mouse input will be used for
   * the list and list items. The property is available to descendant components as the
   * `dense` context.
   */
  dense: _propTypes.default.bool,

  /**
   * If `true`, vertical padding will be removed from the list.
   */
  disablePadding: _propTypes.default.bool,

  /**
   * The content of the subheader, normally `ListSubheader`.
   */
  subheader: _propTypes.default.node
} : void 0;
List.defaultProps = {
  component: 'ul',
  dense: false,
  disablePadding: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiList'
})(List);

exports.default = _default;