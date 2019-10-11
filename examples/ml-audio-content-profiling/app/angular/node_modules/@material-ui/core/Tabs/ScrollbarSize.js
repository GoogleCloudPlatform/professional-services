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

var _reactEventListener = _interopRequireDefault(require("react-event-listener"));

var _debounce = _interopRequireDefault(require("debounce"));

// < 1kb payload overhead when lodash/debounce is > 3kb.
var styles = {
  width: 90,
  height: 90,
  position: 'absolute',
  top: -9000,
  overflow: 'scroll',
  // Support IE 11
  msOverflowStyle: 'scrollbar'
};
/**
 * @ignore - internal component.
 * The component is originates from https://github.com/STORIS/react-scrollbar-size.
 * It has been moved into the core in order to minimize the bundle size.
 */

var ScrollbarSize =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(ScrollbarSize, _React$Component);

  function ScrollbarSize() {
    var _this;

    (0, _classCallCheck2.default)(this, ScrollbarSize);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ScrollbarSize).call(this));

    _this.handleRef = function (ref) {
      _this.nodeRef = ref;
    };

    _this.setMeasurements = function () {
      var nodeRef = _this.nodeRef;

      if (!nodeRef) {
        return;
      }

      _this.scrollbarHeight = nodeRef.offsetHeight - nodeRef.clientHeight;
    };

    if (typeof window !== 'undefined') {
      _this.handleResize = (0, _debounce.default)(function () {
        var prevHeight = _this.scrollbarHeight;

        _this.setMeasurements();

        if (prevHeight !== _this.scrollbarHeight) {
          _this.props.onChange(_this.scrollbarHeight);
        }
      }, 166); // Corresponds to 10 frames at 60 Hz.
    }

    return _this;
  }

  (0, _createClass2.default)(ScrollbarSize, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.setMeasurements();
      this.props.onChange(this.scrollbarHeight);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.handleResize.clear();
    }
  }, {
    key: "render",
    value: function render() {
      return _react.default.createElement(_react.default.Fragment, null, _react.default.createElement(_reactEventListener.default, {
        target: "window",
        onResize: this.handleResize
      }), _react.default.createElement("div", {
        style: styles,
        ref: this.handleRef
      }));
    }
  }]);
  return ScrollbarSize;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? ScrollbarSize.propTypes = {
  onChange: _propTypes.default.func.isRequired
} : void 0;
var _default = ScrollbarSize;
exports.default = _default;