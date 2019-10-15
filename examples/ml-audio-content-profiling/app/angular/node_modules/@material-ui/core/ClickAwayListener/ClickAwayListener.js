"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactEventListener = _interopRequireDefault(require("react-event-listener"));

var _ownerDocument = _interopRequireDefault(require("../utils/ownerDocument"));

// @inheritedComponent EventListener

/**
 * Listen for click events that occur somewhere in the document, outside of the element itself.
 * For instance, if you need to hide a menu when people click anywhere else on your page.
 */
var ClickAwayListener =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(ClickAwayListener, _React$Component);

  function ClickAwayListener() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, ClickAwayListener);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(ClickAwayListener)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.mounted = false;
    _this.moved = false;

    _this.handleClickAway = function (event) {
      // Ignore events that have been `event.preventDefault()` marked.
      if (event.defaultPrevented) {
        return;
      } // IE 11 support, which trigger the handleClickAway even after the unbind


      if (!_this.mounted) {
        return;
      } // Do not act if user performed touchmove


      if (_this.moved) {
        _this.moved = false;
        return;
      } // The child might render null.


      if (!_this.node) {
        return;
      }

      var doc = (0, _ownerDocument.default)(_this.node);

      if (doc.documentElement && doc.documentElement.contains(event.target) && !_this.node.contains(event.target)) {
        _this.props.onClickAway(event);
      }
    };

    _this.handleTouchMove = function () {
      _this.moved = true;
    };

    return _this;
  }

  (0, _createClass2.default)(ClickAwayListener, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // Finds the first child when a component returns a fragment.
      // https://github.com/facebook/react/blob/036ae3c6e2f056adffc31dfb78d1b6f0c63272f0/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L105
      this.node = _reactDom.default.findDOMNode(this);
      this.mounted = true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.mounted = false;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          children = _this$props.children,
          mouseEvent = _this$props.mouseEvent,
          touchEvent = _this$props.touchEvent,
          onClickAway = _this$props.onClickAway,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["children", "mouseEvent", "touchEvent", "onClickAway"]);
      var listenerProps = {};

      if (mouseEvent !== false) {
        listenerProps[mouseEvent] = this.handleClickAway;
      }

      if (touchEvent !== false) {
        listenerProps[touchEvent] = this.handleClickAway;
        listenerProps.onTouchMove = this.handleTouchMove;
      }

      return _react.default.createElement(_react.default.Fragment, null, children, _react.default.createElement(_reactEventListener.default, (0, _extends2.default)({
        target: "document"
      }, listenerProps, other)));
    }
  }]);
  return ClickAwayListener;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? ClickAwayListener.propTypes = {
  /**
   * The wrapped element.
   */
  children: _propTypes.default.element.isRequired,

  /**
   * The mouse event to listen to. You can disable the listener by providing `false`.
   */
  mouseEvent: _propTypes.default.oneOf(['onClick', 'onMouseDown', 'onMouseUp', false]),

  /**
   * Callback fired when a "click away" event is detected.
   */
  onClickAway: _propTypes.default.func.isRequired,

  /**
   * The touch event to listen to. You can disable the listener by providing `false`.
   */
  touchEvent: _propTypes.default.oneOf(['onTouchStart', 'onTouchEnd', false])
} : void 0;
ClickAwayListener.defaultProps = {
  mouseEvent: 'onMouseUp',
  touchEvent: 'onTouchEnd'
};
var _default = ClickAwayListener;
exports.default = _default;