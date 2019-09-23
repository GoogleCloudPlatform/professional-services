"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styles = require("../styles");

var _utils = require("@material-ui/utils");

/* eslint-disable react/no-unused-prop-types */
var styles = function styles(theme) {
  return {
    '@global': {
      html: {
        WebkitFontSmoothing: 'antialiased',
        // Antialiasing.
        MozOsxFontSmoothing: 'grayscale',
        // Antialiasing.
        // Change from `box-sizing: content-box` so that `width`
        // is not affected by `padding` or `border`.
        boxSizing: 'border-box'
      },
      '*, *::before, *::after': {
        boxSizing: 'inherit'
      },
      body: {
        margin: 0,
        // Remove the margin in all browsers.
        backgroundColor: theme.palette.background.default,
        '@media print': {
          // Save printer ink.
          backgroundColor: theme.palette.common.white
        }
      }
    }
  };
};
/**
 * Kickstart an elegant, consistent, and simple baseline to build upon.
 */


var CssBaseline =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(CssBaseline, _React$Component);

  function CssBaseline() {
    (0, _classCallCheck2.default)(this, CssBaseline);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(CssBaseline).apply(this, arguments));
  }

  (0, _createClass2.default)(CssBaseline, [{
    key: "render",
    value: function render() {
      return this.props.children;
    }
  }]);
  return CssBaseline;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? CssBaseline.propTypes = {
  /**
   * You can wrap a node.
   */
  children: _propTypes.default.node,

  /**
   * @ignore
   */
  classes: _propTypes.default.object.isRequired
} : void 0;

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV !== "production" ? CssBaseline.propTypes = (0, _utils.exactProp)(CssBaseline.propTypes) : void 0;
}

CssBaseline.defaultProps = {
  children: null
};

var _default = (0, _styles.withStyles)(styles, {
  name: 'MuiCssBaseline'
})(CssBaseline);

exports.default = _default;