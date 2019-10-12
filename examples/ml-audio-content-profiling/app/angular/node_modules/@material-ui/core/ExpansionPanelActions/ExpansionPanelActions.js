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

var _reactHelpers = require("../utils/reactHelpers");

require("../Button");

// So we don't have any override priority issue.
var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '16px 8px'
  },

  /* Styles applied to the children. */
  action: {
    marginLeft: 8
  }
};
exports.styles = styles;

function ExpansionPanelActions(props) {
  var children = props.children,
      classes = props.classes,
      className = props.className,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className"]);
  return _react.default.createElement("div", (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className)
  }, other), (0, _reactHelpers.cloneChildrenWithClassName)(children, classes.action));
}

process.env.NODE_ENV !== "production" ? ExpansionPanelActions.propTypes = {
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
  className: _propTypes.default.string
} : void 0;

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiExpansionPanelActions'
})(ExpansionPanelActions);

exports.default = _default;