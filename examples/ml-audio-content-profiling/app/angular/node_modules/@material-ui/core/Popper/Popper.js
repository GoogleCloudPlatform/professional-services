"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _popper = _interopRequireDefault(require("popper.js"));

var _Portal = _interopRequireDefault(require("../Portal"));

function flipPlacement(placement) {
  var direction = typeof window !== 'undefined' && document.body.getAttribute('dir') || 'ltr';

  if (direction !== 'rtl') {
    return placement;
  }

  switch (placement) {
    case 'bottom-end':
      return 'bottom-start';

    case 'bottom-start':
      return 'bottom-end';

    case 'top-end':
      return 'top-start';

    case 'top-start':
      return 'top-end';

    default:
      return placement;
  }
}

function getAnchorEl(anchorEl) {
  return typeof anchorEl === 'function' ? anchorEl() : anchorEl;
}
/**
 * Poppers rely on the 3rd party library [Popper.js](https://github.com/FezVrasta/popper.js) for positioning.
 */


var Popper =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Popper, _React$Component);

  function Popper(props) {
    var _this;

    (0, _classCallCheck2.default)(this, Popper);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Popper).call(this));

    _this.handleOpen = function () {
      var _this$props = _this.props,
          anchorEl = _this$props.anchorEl,
          modifiers = _this$props.modifiers,
          open = _this$props.open,
          placement = _this$props.placement,
          _this$props$popperOpt = _this$props.popperOptions,
          popperOptions = _this$props$popperOpt === void 0 ? {} : _this$props$popperOpt,
          disablePortal = _this$props.disablePortal;

      var popperNode = _reactDom.default.findDOMNode((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)));

      if (!popperNode || !anchorEl || !open) {
        return;
      }

      if (_this.popper) {
        _this.popper.destroy();

        _this.popper = null;
      }

      _this.popper = new _popper.default(getAnchorEl(anchorEl), popperNode, (0, _extends2.default)({
        placement: flipPlacement(placement)
      }, popperOptions, {
        modifiers: (0, _extends2.default)({}, disablePortal ? {} : {
          // It's using scrollParent by default, we can use the viewport when using a portal.
          preventOverflow: {
            boundariesElement: 'window'
          }
        }, modifiers, popperOptions.modifiers),
        // We could have been using a custom modifier like react-popper is doing.
        // But it seems this is the best public API for this use case.
        onCreate: _this.handlePopperUpdate,
        onUpdate: _this.handlePopperUpdate
      }));
    };

    _this.handlePopperUpdate = function (data) {
      if (data.placement !== _this.state.placement) {
        _this.setState({
          placement: data.placement
        });
      }
    };

    _this.handleExited = function () {
      _this.setState({
        exited: true
      });

      _this.handleClose();
    };

    _this.handleClose = function () {
      if (!_this.popper) {
        return;
      }

      _this.popper.destroy();

      _this.popper = null;
    };

    _this.state = {
      exited: !props.open
    };
    return _this;
  }

  (0, _createClass2.default)(Popper, [{
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (prevProps.open !== this.props.open && !this.props.open && !this.props.transition) {
        // Otherwise handleExited will call this.
        this.handleClose();
      } // Let's update the popper position.


      if (prevProps.open !== this.props.open || prevProps.anchorEl !== this.props.anchorEl || prevProps.popperOptions !== this.props.popperOptions || prevProps.modifiers !== this.props.modifiers || prevProps.disablePortal !== this.props.disablePortal || prevProps.placement !== this.props.placement) {
        this.handleOpen();
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.handleClose();
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          anchorEl = _this$props2.anchorEl,
          children = _this$props2.children,
          container = _this$props2.container,
          disablePortal = _this$props2.disablePortal,
          keepMounted = _this$props2.keepMounted,
          modifiers = _this$props2.modifiers,
          open = _this$props2.open,
          placementProps = _this$props2.placement,
          popperOptions = _this$props2.popperOptions,
          transition = _this$props2.transition,
          other = (0, _objectWithoutProperties2.default)(_this$props2, ["anchorEl", "children", "container", "disablePortal", "keepMounted", "modifiers", "open", "placement", "popperOptions", "transition"]);
      var _this$state = this.state,
          exited = _this$state.exited,
          placement = _this$state.placement;

      if (!keepMounted && !open && (!transition || exited)) {
        return null;
      }

      var childProps = {
        placement: placement || flipPlacement(placementProps)
      };

      if (transition) {
        childProps.TransitionProps = {
          in: open,
          onExited: this.handleExited
        };
      }

      return _react.default.createElement(_Portal.default, {
        onRendered: this.handleOpen,
        disablePortal: disablePortal,
        container: container
      }, _react.default.createElement("div", (0, _extends2.default)({
        role: "tooltip",
        style: {
          // Prevents scroll issue, waiting for Popper.js to add this style once initiated.
          position: 'absolute'
        }
      }, other), typeof children === 'function' ? children(childProps) : children));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(nextProps) {
      if (nextProps.open) {
        return {
          exited: false
        };
      }

      if (!nextProps.transition) {
        // Otherwise let handleExited take care of marking exited.
        return {
          exited: true
        };
      }

      return null;
    }
  }]);
  return Popper;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Popper.propTypes = {
  /**
   * This is the DOM element, or a function that returns the DOM element,
   * that may be used to set the position of the popover.
   * The return value will passed as the reference object of the Popper
   * instance.
   */
  anchorEl: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.func]),

  /**
   * Popper render function or node.
   */
  children: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]).isRequired,

  /**
   * A node, component instance, or function that returns either.
   * The `container` will passed to the Modal component.
   * By default, it uses the body of the anchorEl's top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.func]),

  /**
   * Disable the portal behavior.
   * The children stay within it's parent DOM hierarchy.
   */
  disablePortal: _propTypes.default.bool,

  /**
   * Always keep the children in the DOM.
   * This property can be useful in SEO situation or
   * when you want to maximize the responsiveness of the Popper.
   */
  keepMounted: _propTypes.default.bool,

  /**
   * Popper.js is based on a "plugin-like" architecture,
   * most of its features are fully encapsulated "modifiers".
   *
   * A modifier is a function that is called each time Popper.js needs to
   * compute the position of the popper.
   * For this reason, modifiers should be very performant to avoid bottlenecks.
   * To learn how to create a modifier, [read the modifiers documentation](https://github.com/FezVrasta/popper.js/blob/master/docs/_includes/popper-documentation.md#modifiers--object).
   */
  modifiers: _propTypes.default.object,

  /**
   * If `true`, the popper is visible.
   */
  open: _propTypes.default.bool.isRequired,

  /**
   * Popper placement.
   */
  placement: _propTypes.default.oneOf(['bottom-end', 'bottom-start', 'bottom', 'left-end', 'left-start', 'left', 'right-end', 'right-start', 'right', 'top-end', 'top-start', 'top']),

  /**
   * Options provided to the [`popper.js`](https://github.com/FezVrasta/popper.js) instance.
   */
  popperOptions: _propTypes.default.object,

  /**
   * Help supporting a react-transition-group/Transition component.
   */
  transition: _propTypes.default.bool
} : void 0;
Popper.defaultProps = {
  disablePortal: false,
  placement: 'bottom',
  transition: false
};
var _default = Popper;
exports.default = _default;