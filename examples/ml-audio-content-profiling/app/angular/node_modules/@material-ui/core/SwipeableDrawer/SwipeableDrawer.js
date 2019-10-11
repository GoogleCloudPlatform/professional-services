"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reset = reset;
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _Drawer = _interopRequireWildcard(require("../Drawer/Drawer"));

var _transitions = require("../styles/transitions");

var _withTheme = _interopRequireDefault(require("../styles/withTheme"));

var _utils = require("../transitions/utils");

var _NoSsr = _interopRequireDefault(require("../NoSsr"));

var _SwipeArea = _interopRequireDefault(require("./SwipeArea"));

/* eslint-disable consistent-this */
// @inheritedComponent Drawer
// This value is closed to what browsers are using internally to
// trigger a native scroll.
var UNCERTAINTY_THRESHOLD = 3; // px
// We can only have one node at the time claiming ownership for handling the swipe.
// Otherwise, the UX would be confusing.
// That's why we use a singleton here.

var nodeThatClaimedTheSwipe = null; // Exported for test purposes.

function reset() {
  nodeThatClaimedTheSwipe = null;
}
/* istanbul ignore if */


if (process.env.NODE_ENV !== 'production' && !_react.default.createContext) {
  throw new Error('Material-UI: react@16.3.0 or greater is required.');
}

var SwipeableDrawer =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(SwipeableDrawer, _React$Component);

  function SwipeableDrawer() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, SwipeableDrawer);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(SwipeableDrawer)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.state = {};
    _this.isSwiping = null;
    _this.swipeAreaRef = _react.default.createRef();

    _this.handleBodyTouchStart = function (event) {
      // We are not supposed to handle this touch move.
      if (nodeThatClaimedTheSwipe !== null && nodeThatClaimedTheSwipe !== (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this))) {
        return;
      }

      var _this$props = _this.props,
          disableDiscovery = _this$props.disableDiscovery,
          disableSwipeToOpen = _this$props.disableSwipeToOpen,
          open = _this$props.open,
          swipeAreaWidth = _this$props.swipeAreaWidth;
      var anchor = (0, _Drawer.getAnchor)(_this.props);
      var currentX = anchor === 'right' ? document.body.offsetWidth - event.touches[0].pageX : event.touches[0].pageX;
      var currentY = anchor === 'bottom' ? window.innerHeight - event.touches[0].clientY : event.touches[0].clientY;

      if (!open) {
        if (disableSwipeToOpen || event.target !== _this.swipeAreaRef.current) {
          return;
        }

        if ((0, _Drawer.isHorizontal)(_this.props)) {
          if (currentX > swipeAreaWidth) {
            return;
          }
        } else if (currentY > swipeAreaWidth) {
          return;
        }
      }

      nodeThatClaimedTheSwipe = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this));
      _this.startX = currentX;
      _this.startY = currentY;

      _this.setState({
        maybeSwiping: true
      });

      if (!open && _this.paperRef) {
        // The ref may be null when a parent component updates while swiping.
        _this.setPosition(_this.getMaxTranslate() + (disableDiscovery ? 20 : -swipeAreaWidth), {
          changeTransition: false
        });
      }

      _this.velocity = 0;
      _this.lastTime = null;
      _this.lastTranslate = null;
      document.body.addEventListener('touchmove', _this.handleBodyTouchMove, {
        passive: false
      });
      document.body.addEventListener('touchend', _this.handleBodyTouchEnd); // https://plus.google.com/+PaulIrish/posts/KTwfn1Y2238

      document.body.addEventListener('touchcancel', _this.handleBodyTouchEnd);
    };

    _this.handleBodyTouchMove = function (event) {
      // The ref may be null when a parent component updates while swiping.
      if (!_this.paperRef) return;
      var anchor = (0, _Drawer.getAnchor)(_this.props);
      var horizontalSwipe = (0, _Drawer.isHorizontal)(_this.props);
      var currentX = anchor === 'right' ? document.body.offsetWidth - event.touches[0].pageX : event.touches[0].pageX;
      var currentY = anchor === 'bottom' ? window.innerHeight - event.touches[0].clientY : event.touches[0].clientY; // We don't know yet.

      if (_this.isSwiping == null) {
        var dx = Math.abs(currentX - _this.startX);
        var dy = Math.abs(currentY - _this.startY); // We are likely to be swiping, let's prevent the scroll event on iOS.

        if (dx > dy) {
          event.preventDefault();
        }

        var isSwiping = horizontalSwipe ? dx > dy && dx > UNCERTAINTY_THRESHOLD : dy > dx && dy > UNCERTAINTY_THRESHOLD;

        if (isSwiping === true || (horizontalSwipe ? dy > UNCERTAINTY_THRESHOLD : dx > UNCERTAINTY_THRESHOLD)) {
          _this.isSwiping = isSwiping;

          if (!isSwiping) {
            _this.handleBodyTouchEnd(event);

            return;
          } // Shift the starting point.


          _this.startX = currentX;
          _this.startY = currentY; // Compensate for the part of the drawer displayed on touch start.

          if (!_this.props.disableDiscovery && !_this.props.open) {
            if (horizontalSwipe) {
              _this.startX -= _this.props.swipeAreaWidth;
            } else {
              _this.startY -= _this.props.swipeAreaWidth;
            }
          }
        }
      }

      if (!_this.isSwiping) {
        return;
      }

      var translate = _this.getTranslate(horizontalSwipe ? currentX : currentY);

      if (_this.lastTranslate === null) {
        _this.lastTranslate = translate;
        _this.lastTime = performance.now() + 1;
      }

      var velocity = (translate - _this.lastTranslate) / (performance.now() - _this.lastTime) * 1e3; // Low Pass filter.

      _this.velocity = _this.velocity * 0.4 + velocity * 0.6;
      _this.lastTranslate = translate;
      _this.lastTime = performance.now(); // We are swiping, let's prevent the scroll event on iOS.

      event.preventDefault();

      _this.setPosition(translate);
    };

    _this.handleBodyTouchEnd = function (event) {
      nodeThatClaimedTheSwipe = null;

      _this.removeBodyTouchListeners();

      _this.setState({
        maybeSwiping: false
      }); // The swipe wasn't started.


      if (!_this.isSwiping) {
        _this.isSwiping = null;
        return;
      }

      _this.isSwiping = null;
      var anchor = (0, _Drawer.getAnchor)(_this.props);
      var current;

      if ((0, _Drawer.isHorizontal)(_this.props)) {
        current = anchor === 'right' ? document.body.offsetWidth - event.changedTouches[0].pageX : event.changedTouches[0].pageX;
      } else {
        current = anchor === 'bottom' ? window.innerHeight - event.changedTouches[0].clientY : event.changedTouches[0].clientY;
      }

      var translateRatio = _this.getTranslate(current) / _this.getMaxTranslate();

      if (_this.props.open) {
        if (_this.velocity > _this.props.minFlingVelocity || translateRatio > _this.props.hysteresis) {
          _this.props.onClose();
        } else {
          // Reset the position, the swipe was aborted.
          _this.setPosition(0, {
            mode: 'exit'
          });
        }

        return;
      }

      if (_this.velocity < -_this.props.minFlingVelocity || 1 - translateRatio > _this.props.hysteresis) {
        _this.props.onOpen();
      } else {
        // Reset the position, the swipe was aborted.
        _this.setPosition(_this.getMaxTranslate(), {
          mode: 'enter'
        });
      }
    };

    _this.handleBackdropRef = function (ref) {
      _this.backdropRef = ref ? _reactDom.default.findDOMNode(ref) : null;
    };

    _this.handlePaperRef = function (ref) {
      _this.paperRef = ref ? _reactDom.default.findDOMNode(ref) : null;
    };

    return _this;
  }

  (0, _createClass2.default)(SwipeableDrawer, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.props.variant === 'temporary') {
        this.listenTouchStart();
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      var variant = this.props.variant;
      var prevVariant = prevProps.variant;

      if (variant !== prevVariant) {
        if (variant === 'temporary') {
          this.listenTouchStart();
        } else if (prevVariant === 'temporary') {
          this.removeTouchStart();
        }
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.removeTouchStart();
      this.removeBodyTouchListeners(); // We need to release the lock.

      if (nodeThatClaimedTheSwipe === this) {
        nodeThatClaimedTheSwipe = null;
      }
    }
  }, {
    key: "getMaxTranslate",
    value: function getMaxTranslate() {
      return (0, _Drawer.isHorizontal)(this.props) ? this.paperRef.clientWidth : this.paperRef.clientHeight;
    }
  }, {
    key: "getTranslate",
    value: function getTranslate(current) {
      var start = (0, _Drawer.isHorizontal)(this.props) ? this.startX : this.startY;
      return Math.min(Math.max(this.props.open ? start - current : this.getMaxTranslate() + start - current, 0), this.getMaxTranslate());
    }
  }, {
    key: "setPosition",
    value: function setPosition(translate) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var _options$mode = options.mode,
          mode = _options$mode === void 0 ? null : _options$mode,
          _options$changeTransi = options.changeTransition,
          changeTransition = _options$changeTransi === void 0 ? true : _options$changeTransi;
      var anchor = (0, _Drawer.getAnchor)(this.props);
      var rtlTranslateMultiplier = ['right', 'bottom'].indexOf(anchor) !== -1 ? 1 : -1;
      var transform = (0, _Drawer.isHorizontal)(this.props) ? "translate(".concat(rtlTranslateMultiplier * translate, "px, 0)") : "translate(0, ".concat(rtlTranslateMultiplier * translate, "px)");
      var drawerStyle = this.paperRef.style;
      drawerStyle.webkitTransform = transform;
      drawerStyle.transform = transform;
      var transition = '';

      if (mode) {
        transition = this.props.theme.transitions.create('all', (0, _utils.getTransitionProps)({
          timeout: this.props.transitionDuration
        }, {
          mode: mode
        }));
      }

      if (changeTransition) {
        drawerStyle.webkitTransition = transition;
        drawerStyle.transition = transition;
      }

      if (!this.props.disableBackdropTransition && !this.props.hideBackdrop) {
        var backdropStyle = this.backdropRef.style;
        backdropStyle.opacity = 1 - translate / this.getMaxTranslate();

        if (changeTransition) {
          backdropStyle.webkitTransition = transition;
          backdropStyle.transition = transition;
        }
      }
    }
  }, {
    key: "listenTouchStart",
    value: function listenTouchStart() {
      document.body.addEventListener('touchstart', this.handleBodyTouchStart);
    }
  }, {
    key: "removeTouchStart",
    value: function removeTouchStart() {
      document.body.removeEventListener('touchstart', this.handleBodyTouchStart);
    }
  }, {
    key: "removeBodyTouchListeners",
    value: function removeBodyTouchListeners() {
      document.body.removeEventListener('touchmove', this.handleBodyTouchMove, {
        passive: false
      });
      document.body.removeEventListener('touchend', this.handleBodyTouchEnd);
      document.body.removeEventListener('touchcancel', this.handleBodyTouchEnd);
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          anchor = _this$props2.anchor,
          disableBackdropTransition = _this$props2.disableBackdropTransition,
          disableDiscovery = _this$props2.disableDiscovery,
          disableSwipeToOpen = _this$props2.disableSwipeToOpen,
          hysteresis = _this$props2.hysteresis,
          minFlingVelocity = _this$props2.minFlingVelocity,
          _this$props2$ModalPro = _this$props2.ModalProps;
      _this$props2$ModalPro = _this$props2$ModalPro === void 0 ? {} : _this$props2$ModalPro;
      var BackdropProps = _this$props2$ModalPro.BackdropProps,
          ModalPropsProp = (0, _objectWithoutProperties2.default)(_this$props2$ModalPro, ["BackdropProps"]),
          onOpen = _this$props2.onOpen,
          open = _this$props2.open,
          _this$props2$PaperPro = _this$props2.PaperProps,
          PaperProps = _this$props2$PaperPro === void 0 ? {} : _this$props2$PaperPro,
          SwipeAreaProps = _this$props2.SwipeAreaProps,
          swipeAreaWidth = _this$props2.swipeAreaWidth,
          variant = _this$props2.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props2, ["anchor", "disableBackdropTransition", "disableDiscovery", "disableSwipeToOpen", "hysteresis", "minFlingVelocity", "ModalProps", "onOpen", "open", "PaperProps", "SwipeAreaProps", "swipeAreaWidth", "variant"]);
      var maybeSwiping = this.state.maybeSwiping;
      return _react.default.createElement(_react.default.Fragment, null, _react.default.createElement(_Drawer.default, (0, _extends2.default)({
        open: variant === 'temporary' && maybeSwiping ? true : open,
        variant: variant,
        ModalProps: (0, _extends2.default)({
          BackdropProps: (0, _extends2.default)({}, BackdropProps, {
            ref: this.handleBackdropRef
          })
        }, ModalPropsProp),
        PaperProps: (0, _extends2.default)({}, PaperProps, {
          style: (0, _extends2.default)({
            pointerEvents: variant === 'temporary' && !open ? 'none' : ''
          }, PaperProps.style),
          ref: this.handlePaperRef
        }),
        anchor: anchor
      }, other)), !disableSwipeToOpen && variant === 'temporary' && _react.default.createElement(_NoSsr.default, null, _react.default.createElement(_SwipeArea.default, (0, _extends2.default)({
        anchor: anchor,
        innerRef: this.swipeAreaRef,
        width: swipeAreaWidth
      }, SwipeAreaProps))));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(nextProps, prevState) {
      if (typeof prevState.maybeSwiping === 'undefined') {
        return {
          maybeSwiping: false,
          open: nextProps.open
        };
      }

      if (!nextProps.open && prevState.open) {
        return {
          maybeSwiping: false,
          open: nextProps.open
        };
      }

      return {
        open: nextProps.open
      };
    }
  }]);
  return SwipeableDrawer;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? SwipeableDrawer.propTypes = {
  /**
   * @ignore
   */
  anchor: _propTypes.default.oneOf(['left', 'top', 'right', 'bottom']),

  /**
   * Disable the backdrop transition.
   * This can improve the FPS on low-end devices.
   */
  disableBackdropTransition: _propTypes.default.bool,

  /**
   * If `true`, touching the screen near the edge of the drawer will not slide in the drawer a bit
   * to promote accidental discovery of the swipe gesture.
   */
  disableDiscovery: _propTypes.default.bool,

  /**
   * If `true`, swipe to open is disabled. This is useful in browsers where swiping triggers
   * navigation actions. Swipe to open is disabled on iOS browsers by default.
   */
  disableSwipeToOpen: _propTypes.default.bool,

  /**
   * @ignore
   */
  hideBackdrop: _propTypes.default.bool,

  /**
   * Affects how far the drawer must be opened/closed to change his state.
   * Specified as percent (0-1) of the width of the drawer
   */
  hysteresis: _propTypes.default.number,

  /**
   * Defines, from which (average) velocity on, the swipe is
   * defined as complete although hysteresis isn't reached.
   * Good threshold is between 250 - 1000 px/s
   */
  minFlingVelocity: _propTypes.default.number,

  /**
   * @ignore
   */
  ModalProps: _propTypes.default.object,

  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback
   */
  onClose: _propTypes.default.func.isRequired,

  /**
   * Callback fired when the component requests to be opened.
   *
   * @param {object} event The event source of the callback
   */
  onOpen: _propTypes.default.func.isRequired,

  /**
   * If `true`, the drawer is open.
   */
  open: _propTypes.default.bool.isRequired,

  /**
   * @ignore
   */
  PaperProps: _propTypes.default.object,

  /**
   * Properties applied to the swipe area element.
   */
  SwipeAreaProps: _propTypes.default.object,

  /**
   * The width of the left most (or right most) area in pixels where the
   * drawer can be swiped open from.
   */
  swipeAreaWidth: _propTypes.default.number,

  /**
   * @ignore
   */
  theme: _propTypes.default.object.isRequired,

  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  })]),

  /**
   * @ignore
   */
  variant: _propTypes.default.oneOf(['permanent', 'persistent', 'temporary'])
} : void 0;
SwipeableDrawer.defaultProps = {
  anchor: 'left',
  disableBackdropTransition: false,
  disableDiscovery: false,
  disableSwipeToOpen: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
  hysteresis: 0.55,
  minFlingVelocity: 400,
  swipeAreaWidth: 20,
  transitionDuration: {
    enter: _transitions.duration.enteringScreen,
    exit: _transitions.duration.leavingScreen
  },
  variant: 'temporary' // Mobile first.

};

var _default = (0, _withTheme.default)()(SwipeableDrawer);

exports.default = _default;