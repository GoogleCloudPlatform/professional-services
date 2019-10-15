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

var _withTheme = _interopRequireDefault(require("../styles/withTheme"));

var _utils = require("../transitions/utils");

// @inheritedComponent Transition
function getScale(value) {
  return "scale(".concat(value, ", ").concat(Math.pow(value, 2), ")");
}

var styles = {
  entering: {
    opacity: 1,
    transform: getScale(1)
  },
  entered: {
    opacity: 1,
    // Use translateZ to scrolling issue on Chrome.
    transform: "".concat(getScale(1), " translateZ(0)")
  }
};
/**
 * The Grow transition is used by the [Tooltip](/demos/tooltips/) and
 * [Popover](/utils/popover/) components.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */

var Grow =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Grow, _React$Component);

  function Grow() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Grow);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Grow)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleEnter = function (node) {
      var _this$props = _this.props,
          theme = _this$props.theme,
          timeout = _this$props.timeout;
      (0, _utils.reflow)(node); // So the animation always start from the start.

      var _getTransitionProps = (0, _utils.getTransitionProps)(_this.props, {
        mode: 'enter'
      }),
          transitionDuration = _getTransitionProps.duration,
          delay = _getTransitionProps.delay;

      var duration = 0;

      if (timeout === 'auto') {
        duration = theme.transitions.getAutoHeightDuration(node.clientHeight);
        _this.autoTimeout = duration;
      } else {
        duration = transitionDuration;
      }

      node.style.transition = [theme.transitions.create('opacity', {
        duration: duration,
        delay: delay
      }), theme.transitions.create('transform', {
        duration: duration * 0.666,
        delay: delay
      })].join(',');

      if (_this.props.onEnter) {
        _this.props.onEnter(node);
      }
    };

    _this.handleExit = function (node) {
      var _this$props2 = _this.props,
          theme = _this$props2.theme,
          timeout = _this$props2.timeout;
      var duration = 0;

      var _getTransitionProps2 = (0, _utils.getTransitionProps)(_this.props, {
        mode: 'exit'
      }),
          transitionDuration = _getTransitionProps2.duration,
          delay = _getTransitionProps2.delay;

      if (timeout === 'auto') {
        duration = theme.transitions.getAutoHeightDuration(node.clientHeight);
        _this.autoTimeout = duration;
      } else {
        duration = transitionDuration;
      }

      node.style.transition = [theme.transitions.create('opacity', {
        duration: duration,
        delay: delay
      }), theme.transitions.create('transform', {
        duration: duration * 0.666,
        delay: delay || duration * 0.333
      })].join(',');
      node.style.opacity = '0';
      node.style.transform = getScale(0.75);

      if (_this.props.onExit) {
        _this.props.onExit(node);
      }
    };

    _this.addEndListener = function (_, next) {
      if (_this.props.timeout === 'auto') {
        _this.timer = setTimeout(next, _this.autoTimeout || 0);
      }
    };

    return _this;
  }

  (0, _createClass2.default)(Grow, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      clearTimeout(this.timer);
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props3 = this.props,
          children = _this$props3.children,
          onEnter = _this$props3.onEnter,
          onExit = _this$props3.onExit,
          styleProp = _this$props3.style,
          theme = _this$props3.theme,
          timeout = _this$props3.timeout,
          other = (0, _objectWithoutProperties2.default)(_this$props3, ["children", "onEnter", "onExit", "style", "theme", "timeout"]);
      var style = (0, _extends2.default)({}, styleProp, _react.default.isValidElement(children) ? children.props.style : {});
      return _react.default.createElement(_Transition.default, (0, _extends2.default)({
        appear: true,
        onEnter: this.handleEnter,
        onExit: this.handleExit,
        addEndListener: this.addEndListener,
        timeout: timeout === 'auto' ? null : timeout
      }, other), function (state, childProps) {
        return _react.default.cloneElement(children, (0, _extends2.default)({
          style: (0, _extends2.default)({
            opacity: 0,
            transform: getScale(0.75)
          }, styles[state], style)
        }, childProps));
      });
    }
  }]);
  return Grow;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Grow.propTypes = {
  /**
   * A single child content element.
   */
  children: _propTypes.default.oneOfType([_propTypes.default.element, _propTypes.default.func]),

  /**
   * If `true`, show the component; triggers the enter or exit animation.
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
   *
   * Set to 'auto' to automatically calculate transition time based on height.
   */
  timeout: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  }), _propTypes.default.oneOf(['auto'])])
} : void 0;
Grow.defaultProps = {
  timeout: 'auto'
};
Grow.muiSupportAuto = true;

var _default = (0, _withTheme.default)()(Grow);

exports.default = _default;