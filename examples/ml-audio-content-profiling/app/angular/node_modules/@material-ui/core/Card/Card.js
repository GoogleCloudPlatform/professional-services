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

var _Paper = _interopRequireDefault(require("../Paper"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

// @inheritedComponent Paper
var styles = {
  /* Styles applied to the root element. */
  root: {
    overflow: 'hidden'
  }
};
exports.styles = styles;

function Card(props) {
  var classes = props.classes,
      className = props.className,
      raised = props.raised,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "raised"]);
  return _react.default.createElement(_Paper.default, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className),
    elevation: raised ? 8 : 1
  }, other));
}

process.env.NODE_ENV !== "production" ? Card.propTypes = {
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
   * If `true`, the card will use raised styling.
   */
  raised: _propTypes.default.bool
} : void 0;
Card.defaultProps = {
  raised: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiCard'
})(Card);

exports.default = _default;