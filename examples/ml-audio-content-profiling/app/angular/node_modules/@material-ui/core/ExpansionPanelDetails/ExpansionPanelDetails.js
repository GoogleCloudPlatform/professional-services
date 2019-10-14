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

var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    padding: '8px 24px 24px'
  }
};
exports.styles = styles;

function ExpansionPanelDetails(props) {
  var classes = props.classes,
      children = props.children,
      className = props.className,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "children", "className"]);
  return _react.default.createElement("div", (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className)
  }, other), children);
}

process.env.NODE_ENV !== "production" ? ExpansionPanelDetails.propTypes = {
  /**
   * The content of the expansion panel details.
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
  name: 'MuiExpansionPanelDetails'
})(ExpansionPanelDetails);

exports.default = _default;