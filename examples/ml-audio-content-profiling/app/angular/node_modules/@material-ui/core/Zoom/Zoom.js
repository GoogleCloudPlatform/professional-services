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

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Transition = _interopRequireDefault(require("react-transition-group/Transition"));

var _transitions = require("../styles/transitions");

var _withTheme = _interopRequireDefault(require("../styles/withTheme"));

var _utils = require("../transitions/utils");

// @inheritedComponent Transition
var styles = {
  entering: {
    transform: 'scale(1)'
  },
  entered: {
    transform: 'scale(1)'
  }
};
/**
 * The Zoom transition can be used for the floating variant of the
 * [Button](https://material-ui.com/demos/buttons/#floating-action-buttons) component.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */

var Zoom =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Zoom, _React$Component);

  function Zoom() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Zoom);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Zoom)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleEnter = function (node) {
      var theme = _this.props.theme;
      (0, _utils.reflow)(node); // So the animation always start from the start.

      var transitionProps = (0, _utils.getTransitionProps)(_this.props, {
        mode: 'enter'
      });
      node.style.webkitTransition = theme.transitions.create('transform', transitionProps);
      node.style.transition = theme.transitions.create('transform', transitionProps);

      if (_this.props.onEnter) {
        _this.props.onEnter(node);
      }
    };

    _this.handleExit = function (node) {
      var theme = _this.props.theme;
      var transitionProps = (0, _utils.getTransitionProps)(_this.props, {
        mode: 'exit'
      });
      node.style.webkitTransition = theme.transitions.create('transform', transitionProps);
      node.style.transition = theme.transitions.create('transform', transitionProps);

      if (_this.props.onExit) {
        _this.props.onExit(node);
      }
    };

    return _this;
  }

  (0, _createClass2.default)(Zoom, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          children = _this$props.children,
          onEnter = _this$props.onEnter,
          onExit = _this$props.onExit,
          styleProp = _this$props.style,
          theme = _this$props.theme,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["children", "onEnter", "onExit", "style", "theme"]);
      var style = (0, _extends2.default)({}, styleProp, _react.default.isValidElement(children) ? children.props.style : {});
      return _react.default.createElement(_Transition.default, (0, _extends2.default)({
        appear: true,
        onEnter: this.handleEnter,
        onExit: this.handleExit
      }, other), function (state, childProps) {
        return _react.default.cloneElement(children, (0, _extends2.default)({
          style: (0, _extends2.default)({
            transform: 'scale(0)'
          }, styles[state], style)
        }, childProps));
      });
    }
  }]);
  return Zoom;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Zoom.propTypes = {
  /**
   * A single child content element.
   */
  children: _propTypes.default.oneOfType([_propTypes.default.element, _propTypes.default.func]),

  /**
   * If `true`, the component will transition in.
   */
  in: _propTypes.default.bool,

  /**
   * @ignore
   */
  onEnter: _propTypes.default.func,

  /**
   * @ignore
   */
  onExit: _propTypes.default.func,

  /**
   * @ignore
   */
  style: _propTypes.default.object,

  /**
   * @ignore
   */
  theme: _propTypes.default.object.isRequired,

  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  timeout: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  })])
} : void 0;
Zoom.defaultProps = {
  timeout: {
    enter: _transitions.duration.enteringScreen,
    exit: _transitions.duration.leavingScreen
  }
};

var _default = (0, _withTheme.default)()(Zoom);

exports.default = _default;