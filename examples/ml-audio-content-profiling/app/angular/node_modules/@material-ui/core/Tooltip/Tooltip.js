"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _warning = _interopRequireDefault(require("warning"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _RootRef = _interopRequireDefault(require("../RootRef"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _helpers = require("../utils/helpers");

var _Grow = _interopRequireDefault(require("../Grow"));

var _Popper = _interopRequireDefault(require("../Popper"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the Popper component. */
    popper: {
      zIndex: theme.zIndex.tooltip,
      opacity: 0.9,
      pointerEvents: 'none'
    },

    /* Styles applied to the Popper component if `interactive={true}`. */
    popperInteractive: {
      pointerEvents: 'auto'
    },

    /* Styles applied to the tooltip (label wrapper) element. */
    tooltip: {
      backgroundColor: theme.palette.grey[700],
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.common.white,
      fontFamily: theme.typography.fontFamily,
      padding: '4px 8px',
      fontSize: theme.typography.pxToRem(10),
      lineHeight: "".concat(theme.typography.round(14 / 10), "em"),
      maxWidth: 300
    },

    /* Styles applied to the tooltip (label wrapper) element if the tooltip is opened by touch. */
    touch: {
      padding: '8px 16px',
      fontSize: theme.typography.pxToRem(14),
      lineHeight: "".concat(theme.typography.round(16 / 14), "em")
    },

    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "left". */
    tooltipPlacementLeft: (0, _defineProperty2.default)({
      transformOrigin: 'right center',
      margin: '0 24px '
    }, theme.breakpoints.up('sm'), {
      margin: '0 14px'
    }),

    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "right". */
    tooltipPlacementRight: (0, _defineProperty2.default)({
      transformOrigin: 'left center',
      margin: '0 24px'
    }, theme.breakpoints.up('sm'), {
      margin: '0 14px'
    }),

    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "top". */
    tooltipPlacementTop: (0, _defineProperty2.default)({
      transformOrigin: 'center bottom',
      margin: '24px 0'
    }, theme.breakpoints.up('sm'), {
      margin: '14px 0'
    }),

    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "bottom". */
    tooltipPlacementBottom: (0, _defineProperty2.default)({
      transformOrigin: 'center top',
      margin: '24px 0'
    }, theme.breakpoints.up('sm'), {
      margin: '14px 0'
    })
  };
};

exports.styles = styles;

var Tooltip =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Tooltip, _React$Component);

  function Tooltip(props) {
    var _this;

    (0, _classCallCheck2.default)(this, Tooltip);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Tooltip).call(this));
    _this.ignoreNonTouchEvents = false;

    _this.onRootRef = function (ref) {
      _this.childrenRef = ref;
    };

    _this.handleFocus = function (event) {
      // Workaround for https://github.com/facebook/react/issues/7769
      // The autoFocus of React might trigger the event before the componentDidMount.
      // We need to account for this eventuality.
      if (!_this.childrenRef) {
        _this.childrenRef = event.currentTarget;
      }

      _this.handleEnter(event);

      var childrenProps = _this.props.children.props;

      if (childrenProps.onFocus) {
        childrenProps.onFocus(event);
      }
    };

    _this.handleEnter = function (event) {
      var _this$props = _this.props,
          children = _this$props.children,
          enterDelay = _this$props.enterDelay;
      var childrenProps = children.props;

      if (event.type === 'mouseover' && childrenProps.onMouseOver) {
        childrenProps.onMouseOver(event);
      }

      if (_this.ignoreNonTouchEvents && event.type !== 'touchstart') {
        return;
      } // Remove the title ahead of time.
      // We don't want to wait for the next render commit.
      // We would risk displaying two tooltips at the same time (native + this one).


      _this.childrenRef.setAttribute('title', '');

      clearTimeout(_this.enterTimer);
      clearTimeout(_this.leaveTimer);

      if (enterDelay) {
        event.persist();
        _this.enterTimer = setTimeout(function () {
          _this.handleOpen(event);
        }, enterDelay);
      } else {
        _this.handleOpen(event);
      }
    };

    _this.handleOpen = function (event) {
      // The mouseover event will trigger for every nested element in the tooltip.
      // We can skip rerendering when the tooltip is already open.
      // We are using the mouseover event instead of the mouseenter event to fix a hide/show issue.
      if (!_this.isControlled && !_this.state.open) {
        _this.setState({
          open: true
        });
      }

      if (_this.props.onOpen) {
        _this.props.onOpen(event);
      }
    };

    _this.handleLeave = function (event) {
      var _this$props2 = _this.props,
          children = _this$props2.children,
          leaveDelay = _this$props2.leaveDelay;
      var childrenProps = children.props;

      if (event.type === 'blur' && childrenProps.onBlur) {
        childrenProps.onBlur(event);
      }

      if (event.type === 'mouseleave' && childrenProps.onMouseLeave) {
        childrenProps.onMouseLeave(event);
      }

      clearTimeout(_this.enterTimer);
      clearTimeout(_this.leaveTimer);

      if (leaveDelay) {
        event.persist();
        _this.leaveTimer = setTimeout(function () {
          _this.handleClose(event);
        }, leaveDelay);
      } else {
        _this.handleClose(event);
      }
    };

    _this.handleClose = function (event) {
      if (!_this.isControlled) {
        _this.setState({
          open: false
        });
      }

      if (_this.props.onClose) {
        _this.props.onClose(event);
      }

      clearTimeout(_this.closeTimer);
      _this.closeTimer = setTimeout(function () {
        _this.ignoreNonTouchEvents = false;
      }, _this.props.theme.transitions.duration.shortest);
    };

    _this.handleTouchStart = function (event) {
      _this.ignoreNonTouchEvents = true;
      var _this$props3 = _this.props,
          children = _this$props3.children,
          enterTouchDelay = _this$props3.enterTouchDelay;

      if (children.props.onTouchStart) {
        children.props.onTouchStart(event);
      }

      clearTimeout(_this.leaveTimer);
      clearTimeout(_this.closeTimer);
      clearTimeout(_this.touchTimer);
      event.persist();
      _this.touchTimer = setTimeout(function () {
        _this.handleEnter(event);
      }, enterTouchDelay);
    };

    _this.handleTouchEnd = function (event) {
      var _this$props4 = _this.props,
          children = _this$props4.children,
          leaveTouchDelay = _this$props4.leaveTouchDelay;

      if (children.props.onTouchEnd) {
        children.props.onTouchEnd(event);
      }

      clearTimeout(_this.touchTimer);
      clearTimeout(_this.leaveTimer);
      event.persist();
      _this.leaveTimer = setTimeout(function () {
        _this.handleClose(event);
      }, leaveTouchDelay);
    };

    _this.isControlled = props.open != null;
    _this.state = {
      open: null
    };

    if (!_this.isControlled) {
      // not controlled, use internal state
      _this.state.open = false;
    }

    return _this;
  }

  (0, _createClass2.default)(Tooltip, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      process.env.NODE_ENV !== "production" ? (0, _warning.default)(!this.childrenRef.disabled || this.childrenRef.disabled && this.props.title === '' || this.childrenRef.tagName.toLowerCase() !== 'button', ['Material-UI: you are providing a disabled `button` child to the Tooltip component.', 'A disabled element does not fire events.', "Tooltip needs to listen to the child element's events to display the title.", '', 'Place a `div` container on top of the element.'].join('\n')) : void 0; // Fallback to this default id when possible.
      // Use the random value for client side rendering only.
      // We can't use it server-side.

      this.defaultId = "mui-tooltip-".concat(Math.round(Math.random() * 1e5)); // Rerender with this.defaultId and this.childrenRef.

      if (this.props.open) {
        this.forceUpdate();
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      clearTimeout(this.closeTimer);
      clearTimeout(this.enterTimer);
      clearTimeout(this.focusTimer);
      clearTimeout(this.leaveTimer);
      clearTimeout(this.touchTimer);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props5 = this.props,
          children = _this$props5.children,
          classes = _this$props5.classes,
          disableFocusListener = _this$props5.disableFocusListener,
          disableHoverListener = _this$props5.disableHoverListener,
          disableTouchListener = _this$props5.disableTouchListener,
          enterDelay = _this$props5.enterDelay,
          enterTouchDelay = _this$props5.enterTouchDelay,
          id = _this$props5.id,
          interactive = _this$props5.interactive,
          leaveDelay = _this$props5.leaveDelay,
          leaveTouchDelay = _this$props5.leaveTouchDelay,
          onClose = _this$props5.onClose,
          onOpen = _this$props5.onOpen,
          openProp = _this$props5.open,
          placement = _this$props5.placement,
          PopperProps = _this$props5.PopperProps,
          theme = _this$props5.theme,
          title = _this$props5.title,
          TransitionComponent = _this$props5.TransitionComponent,
          TransitionProps = _this$props5.TransitionProps,
          other = (0, _objectWithoutProperties2.default)(_this$props5, ["children", "classes", "disableFocusListener", "disableHoverListener", "disableTouchListener", "enterDelay", "enterTouchDelay", "id", "interactive", "leaveDelay", "leaveTouchDelay", "onClose", "onOpen", "open", "placement", "PopperProps", "theme", "title", "TransitionComponent", "TransitionProps"]);
      var open = this.isControlled ? openProp : this.state.open; // There is no point in displaying an empty tooltip.

      if (title === '') {
        open = false;
      } // For accessibility and SEO concerns, we render the title to the DOM node when
      // the tooltip is hidden. However, we have made a tradeoff when
      // `disableHoverListener` is set. This title logic is disabled.
      // It's allowing us to keep the implementation size minimal.
      // We are open to change the tradeoff.


      var shouldShowNativeTitle = !open && !disableHoverListener;
      var childrenProps = (0, _extends2.default)({
        'aria-describedby': open ? id || this.defaultId : null,
        title: shouldShowNativeTitle && typeof title === 'string' ? title : null
      }, other, children.props, {
        className: (0, _classnames.default)(other.className, children.props.className)
      });

      if (!disableTouchListener) {
        childrenProps.onTouchStart = this.handleTouchStart;
        childrenProps.onTouchEnd = this.handleTouchEnd;
      }

      if (!disableHoverListener) {
        childrenProps.onMouseOver = this.handleEnter;
        childrenProps.onMouseLeave = this.handleLeave;
      }

      if (!disableFocusListener) {
        childrenProps.onFocus = this.handleFocus;
        childrenProps.onBlur = this.handleLeave;
      }

      var interactiveWrapperListeners = interactive ? {
        onMouseOver: childrenProps.onMouseOver,
        onMouseLeave: childrenProps.onMouseLeave,
        onFocus: childrenProps.onFocus,
        onBlur: childrenProps.onBlur
      } : {};
      process.env.NODE_ENV !== "production" ? (0, _warning.default)(!children.props.title, ['Material-UI: you have provided a `title` property to the child of <Tooltip />.', "Remove this title property `".concat(children.props.title, "` or the Tooltip component.")].join('\n')) : void 0;
      return _react.default.createElement(_react.default.Fragment, null, _react.default.createElement(_RootRef.default, {
        rootRef: this.onRootRef
      }, _react.default.cloneElement(children, childrenProps)), _react.default.createElement(_Popper.default, (0, _extends2.default)({
        className: (0, _classnames.default)(classes.popper, (0, _defineProperty2.default)({}, classes.popperInteractive, interactive)),
        placement: placement,
        anchorEl: this.childrenRef,
        open: open,
        id: childrenProps['aria-describedby'],
        transition: true
      }, interactiveWrapperListeners, PopperProps), function (_ref) {
        var placementInner = _ref.placement,
            TransitionPropsInner = _ref.TransitionProps;
        return _react.default.createElement(TransitionComponent, (0, _extends2.default)({
          timeout: theme.transitions.duration.shorter
        }, TransitionPropsInner, TransitionProps), _react.default.createElement("div", {
          className: (0, _classnames.default)(classes.tooltip, (0, _defineProperty2.default)({}, classes.touch, _this2.ignoreNonTouchEvents), classes["tooltipPlacement".concat((0, _helpers.capitalize)(placementInner.split('-')[0]))])
        }, title));
      }));
    }
  }]);
  return Tooltip;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Tooltip.propTypes = {
  /**
   * Tooltip reference element.
   */
  children: _propTypes.default.element.isRequired,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * Do not respond to focus events.
   */
  disableFocusListener: _propTypes.default.bool,

  /**
   * Do not respond to hover events.
   */
  disableHoverListener: _propTypes.default.bool,

  /**
   * Do not respond to long press touch events.
   */
  disableTouchListener: _propTypes.default.bool,

  /**
   * The number of milliseconds to wait before showing the tooltip.
   * This property won't impact the enter touch delay (`enterTouchDelay`).
   */
  enterDelay: _propTypes.default.number,

  /**
   * The number of milliseconds a user must touch the element before showing the tooltip.
   */
  enterTouchDelay: _propTypes.default.number,

  /**
   * The relationship between the tooltip and the wrapper component is not clear from the DOM.
   * This property is used with aria-describedby to solve the accessibility issue.
   * If you don't provide this property. It falls back to a randomly generated id.
   */
  id: _propTypes.default.string,

  /**
   * Makes a tooltip interactive, i.e. will not close when the user
   * hovers over the tooltip before the `leaveDelay` is expired.
   */
  interactive: _propTypes.default.bool,

  /**
   * The number of milliseconds to wait before hiding the tooltip.
   * This property won't impact the leave touch delay (`leaveTouchDelay`).
   */
  leaveDelay: _propTypes.default.number,

  /**
   * The number of milliseconds after the user stops touching an element before hiding the tooltip.
   */
  leaveTouchDelay: _propTypes.default.number,

  /**
   * Callback fired when the tooltip requests to be closed.
   *
   * @param {object} event The event source of the callback
   */
  onClose: _propTypes.default.func,

  /**
   * Callback fired when the tooltip requests to be open.
   *
   * @param {object} event The event source of the callback
   */
  onOpen: _propTypes.default.func,

  /**
   * If `true`, the tooltip is shown.
   */
  open: _propTypes.default.bool,

  /**
   * Tooltip placement.
   */
  placement: _propTypes.default.oneOf(['bottom-end', 'bottom-start', 'bottom', 'left-end', 'left-start', 'left', 'right-end', 'right-start', 'right', 'top-end', 'top-start', 'top']),

  /**
   * Properties applied to the [`Popper`](/api/popper/) element.
   */
  PopperProps: _propTypes.default.object,

  /**
   * @ignore
   */
  theme: _propTypes.default.object.isRequired,

  /**
   * Tooltip title. Zero-length titles string are never displayed.
   */
  title: _propTypes.default.node.isRequired,

  /**
   * The component used for the transition.
   */
  TransitionComponent: _utils.componentPropType,

  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: _propTypes.default.object
} : void 0;
Tooltip.defaultProps = {
  disableFocusListener: false,
  disableHoverListener: false,
  disableTouchListener: false,
  enterDelay: 0,
  enterTouchDelay: 1000,
  interactive: false,
  leaveDelay: 0,
  leaveTouchDelay: 1500,
  placement: 'bottom',
  TransitionComponent: _Grow.default
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiTooltip',
  withTheme: true
})(Tooltip);

exports.default = _default;