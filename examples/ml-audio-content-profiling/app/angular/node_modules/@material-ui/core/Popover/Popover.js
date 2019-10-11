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

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _warning = _interopRequireDefault(require("warning"));

var _debounce = _interopRequireDefault(require("debounce"));

var _reactEventListener = _interopRequireDefault(require("react-event-listener"));

var _utils = require("@material-ui/utils");

var _ownerDocument = _interopRequireDefault(require("../utils/ownerDocument"));

var _ownerWindow = _interopRequireDefault(require("../utils/ownerWindow"));

var _helpers = require("../utils/helpers");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Modal = _interopRequireDefault(require("../Modal"));

var _Grow = _interopRequireDefault(require("../Grow"));

var _Paper = _interopRequireDefault(require("../Paper"));

// @inheritedComponent Modal
// < 1kb payload overhead when lodash/debounce is > 3kb.
function getOffsetTop(rect, vertical) {
  var offset = 0;

  if (typeof vertical === 'number') {
    offset = vertical;
  } else if (vertical === 'center') {
    offset = rect.height / 2;
  } else if (vertical === 'bottom') {
    offset = rect.height;
  }

  return offset;
}

function getOffsetLeft(rect, horizontal) {
  var offset = 0;

  if (typeof horizontal === 'number') {
    offset = horizontal;
  } else if (horizontal === 'center') {
    offset = rect.width / 2;
  } else if (horizontal === 'right') {
    offset = rect.width;
  }

  return offset;
}

function getTransformOriginValue(transformOrigin) {
  return [transformOrigin.horizontal, transformOrigin.vertical].map(function (n) {
    return typeof n === 'number' ? "".concat(n, "px") : n;
  }).join(' ');
} // Sum the scrollTop between two elements.


function getScrollParent(parent, child) {
  var element = child;
  var scrollTop = 0;

  while (element && element !== parent) {
    element = element.parentNode;
    scrollTop += element.scrollTop;
  }

  return scrollTop;
}

function getAnchorEl(anchorEl) {
  return typeof anchorEl === 'function' ? anchorEl() : anchorEl;
}

var styles = {
  /* Styles applied to the `Paper` component. */
  paper: {
    position: 'absolute',
    overflowY: 'auto',
    overflowX: 'hidden',
    // So we see the popover when it's empty.
    // It's most likely on issue on userland.
    minWidth: 16,
    minHeight: 16,
    maxWidth: 'calc(100% - 32px)',
    maxHeight: 'calc(100% - 32px)',
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none'
  }
};
exports.styles = styles;

var Popover =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Popover, _React$Component);

  function Popover() {
    var _this;

    (0, _classCallCheck2.default)(this, Popover);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Popover).call(this));
    _this.handleGetOffsetTop = getOffsetTop;
    _this.handleGetOffsetLeft = getOffsetLeft;

    _this.componentWillUnmount = function () {
      _this.handleResize.clear();
    };

    _this.setPositioningStyles = function (element) {
      var positioning = _this.getPositioningStyle(element);

      if (positioning.top !== null) {
        element.style.top = positioning.top;
      }

      if (positioning.left !== null) {
        element.style.left = positioning.left;
      }

      element.style.transformOrigin = positioning.transformOrigin;
    };

    _this.getPositioningStyle = function (element) {
      var _this$props = _this.props,
          anchorEl = _this$props.anchorEl,
          anchorReference = _this$props.anchorReference,
          marginThreshold = _this$props.marginThreshold; // Check if the parent has requested anchoring on an inner content node

      var contentAnchorOffset = _this.getContentAnchorOffset(element);

      var elemRect = {
        width: element.offsetWidth,
        height: element.offsetHeight
      }; // Get the transform origin point on the element itself

      var transformOrigin = _this.getTransformOrigin(elemRect, contentAnchorOffset);

      if (anchorReference === 'none') {
        return {
          top: null,
          left: null,
          transformOrigin: getTransformOriginValue(transformOrigin)
        };
      } // Get the offset of of the anchoring element


      var anchorOffset = _this.getAnchorOffset(contentAnchorOffset); // Calculate element positioning


      var top = anchorOffset.top - transformOrigin.vertical;
      var left = anchorOffset.left - transformOrigin.horizontal;
      var bottom = top + elemRect.height;
      var right = left + elemRect.width; // Use the parent window of the anchorEl if provided

      var containerWindow = (0, _ownerWindow.default)(getAnchorEl(anchorEl)); // Window thresholds taking required margin into account

      var heightThreshold = containerWindow.innerHeight - marginThreshold;
      var widthThreshold = containerWindow.innerWidth - marginThreshold; // Check if the vertical axis needs shifting

      if (top < marginThreshold) {
        var diff = top - marginThreshold;
        top -= diff;
        transformOrigin.vertical += diff;
      } else if (bottom > heightThreshold) {
        var _diff = bottom - heightThreshold;

        top -= _diff;
        transformOrigin.vertical += _diff;
      }

      process.env.NODE_ENV !== "production" ? (0, _warning.default)(elemRect.height < heightThreshold || !elemRect.height || !heightThreshold, ['Material-UI: the popover component is too tall.', "Some part of it can not be seen on the screen (".concat(elemRect.height - heightThreshold, "px)."), 'Please consider adding a `max-height` to improve the user-experience.'].join('\n')) : void 0; // Check if the horizontal axis needs shifting

      if (left < marginThreshold) {
        var _diff2 = left - marginThreshold;

        left -= _diff2;
        transformOrigin.horizontal += _diff2;
      } else if (right > widthThreshold) {
        var _diff3 = right - widthThreshold;

        left -= _diff3;
        transformOrigin.horizontal += _diff3;
      }

      return {
        top: "".concat(top, "px"),
        left: "".concat(left, "px"),
        transformOrigin: getTransformOriginValue(transformOrigin)
      };
    };

    _this.handleEntering = function (element) {
      if (_this.props.onEntering) {
        _this.props.onEntering(element);
      }

      _this.setPositioningStyles(element);
    };

    if (typeof window !== 'undefined') {
      _this.handleResize = (0, _debounce.default)(function () {
        // Because we debounce the event, the open property might no longer be true
        // when the callback resolves.
        if (!_this.props.open) {
          return;
        }

        _this.setPositioningStyles(_this.paperRef);
      }, 166); // Corresponds to 10 frames at 60 Hz.
    }

    return _this;
  }

  (0, _createClass2.default)(Popover, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.props.action) {
        this.props.action({
          updatePosition: this.handleResize
        });
      }
    }
  }, {
    key: "getAnchorOffset",
    // Returns the top/left offset of the position
    // to attach to on the anchor element (or body if none is provided)
    value: function getAnchorOffset(contentAnchorOffset) {
      var _this$props2 = this.props,
          anchorEl = _this$props2.anchorEl,
          anchorOrigin = _this$props2.anchorOrigin,
          anchorReference = _this$props2.anchorReference,
          anchorPosition = _this$props2.anchorPosition;

      if (anchorReference === 'anchorPosition') {
        process.env.NODE_ENV !== "production" ? (0, _warning.default)(anchorPosition, 'Material-UI: you need to provide a `anchorPosition` property when using ' + '<Popover anchorReference="anchorPosition" />.') : void 0;
        return anchorPosition;
      } // If an anchor element wasn't provided, just use the parent body element of this Popover


      var anchorElement = getAnchorEl(anchorEl) || (0, _ownerDocument.default)(this.paperRef).body;
      var anchorRect = anchorElement.getBoundingClientRect();
      var anchorVertical = contentAnchorOffset === 0 ? anchorOrigin.vertical : 'center';
      return {
        top: anchorRect.top + this.handleGetOffsetTop(anchorRect, anchorVertical),
        left: anchorRect.left + this.handleGetOffsetLeft(anchorRect, anchorOrigin.horizontal)
      };
    } // Returns the vertical offset of inner content to anchor the transform on if provided

  }, {
    key: "getContentAnchorOffset",
    value: function getContentAnchorOffset(element) {
      var _this$props3 = this.props,
          getContentAnchorEl = _this$props3.getContentAnchorEl,
          anchorReference = _this$props3.anchorReference;
      var contentAnchorOffset = 0;

      if (getContentAnchorEl && anchorReference === 'anchorEl') {
        var contentAnchorEl = getContentAnchorEl(element);

        if (contentAnchorEl && element.contains(contentAnchorEl)) {
          var scrollTop = getScrollParent(element, contentAnchorEl);
          contentAnchorOffset = contentAnchorEl.offsetTop + contentAnchorEl.clientHeight / 2 - scrollTop || 0;
        } // != the default value


        process.env.NODE_ENV !== "production" ? (0, _warning.default)(this.props.anchorOrigin.vertical === 'top', ['Material-UI: you can not change the default `anchorOrigin.vertical` value ', 'when also providing the `getContentAnchorEl` property to the popover component.', 'Only use one of the two properties.', 'Set `getContentAnchorEl` to `null | undefined`' + ' or leave `anchorOrigin.vertical` unchanged.'].join('\n')) : void 0;
      }

      return contentAnchorOffset;
    } // Return the base transform origin using the element
    // and taking the content anchor offset into account if in use

  }, {
    key: "getTransformOrigin",
    value: function getTransformOrigin(elemRect) {
      var contentAnchorOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var transformOrigin = this.props.transformOrigin;
      return {
        vertical: this.handleGetOffsetTop(elemRect, transformOrigin.vertical) + contentAnchorOffset,
        horizontal: this.handleGetOffsetLeft(elemRect, transformOrigin.horizontal)
      };
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props4 = this.props,
          action = _this$props4.action,
          anchorEl = _this$props4.anchorEl,
          anchorOrigin = _this$props4.anchorOrigin,
          anchorPosition = _this$props4.anchorPosition,
          anchorReference = _this$props4.anchorReference,
          children = _this$props4.children,
          classes = _this$props4.classes,
          containerProp = _this$props4.container,
          elevation = _this$props4.elevation,
          getContentAnchorEl = _this$props4.getContentAnchorEl,
          marginThreshold = _this$props4.marginThreshold,
          ModalClasses = _this$props4.ModalClasses,
          onEnter = _this$props4.onEnter,
          onEntered = _this$props4.onEntered,
          onEntering = _this$props4.onEntering,
          onExit = _this$props4.onExit,
          onExited = _this$props4.onExited,
          onExiting = _this$props4.onExiting,
          open = _this$props4.open,
          PaperProps = _this$props4.PaperProps,
          role = _this$props4.role,
          transformOrigin = _this$props4.transformOrigin,
          TransitionComponent = _this$props4.TransitionComponent,
          transitionDurationProp = _this$props4.transitionDuration,
          _this$props4$Transiti = _this$props4.TransitionProps,
          TransitionProps = _this$props4$Transiti === void 0 ? {} : _this$props4$Transiti,
          other = (0, _objectWithoutProperties2.default)(_this$props4, ["action", "anchorEl", "anchorOrigin", "anchorPosition", "anchorReference", "children", "classes", "container", "elevation", "getContentAnchorEl", "marginThreshold", "ModalClasses", "onEnter", "onEntered", "onEntering", "onExit", "onExited", "onExiting", "open", "PaperProps", "role", "transformOrigin", "TransitionComponent", "transitionDuration", "TransitionProps"]);
      var transitionDuration = transitionDurationProp;

      if (transitionDurationProp === 'auto' && !TransitionComponent.muiSupportAuto) {
        transitionDuration = undefined;
      } // If the container prop is provided, use that
      // If the anchorEl prop is provided, use its parent body element as the container
      // If neither are provided let the Modal take care of choosing the container


      var container = containerProp || (anchorEl ? (0, _ownerDocument.default)(getAnchorEl(anchorEl)).body : undefined);
      return _react.default.createElement(_Modal.default, (0, _extends2.default)({
        classes: ModalClasses,
        container: container,
        open: open,
        BackdropProps: {
          invisible: true
        }
      }, other), _react.default.createElement(TransitionComponent, (0, _extends2.default)({
        appear: true,
        in: open,
        onEnter: onEnter,
        onEntered: onEntered,
        onExit: onExit,
        onExited: onExited,
        onExiting: onExiting,
        role: role,
        timeout: transitionDuration
      }, TransitionProps, {
        onEntering: (0, _helpers.createChainedFunction)(this.handleEntering, TransitionProps.onEntering)
      }), _react.default.createElement(_Paper.default, (0, _extends2.default)({
        className: classes.paper,
        elevation: elevation,
        ref: function ref(_ref) {
          _this2.paperRef = _reactDom.default.findDOMNode(_ref);
        }
      }, PaperProps), _react.default.createElement(_reactEventListener.default, {
        target: "window",
        onResize: this.handleResize
      }), children)));
    }
  }]);
  return Popover;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Popover.propTypes = {
  /**
   * This is callback property. It's called by the component on mount.
   * This is useful when you want to trigger an action programmatically.
   * It currently only supports updatePosition() action.
   *
   * @param {object} actions This object contains all possible actions
   * that can be triggered programmatically.
   */
  action: _propTypes.default.func,

  /**
   * This is the DOM element, or a function that returns the DOM element,
   * that may be used to set the position of the popover.
   */
  anchorEl: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.func]),

  /**
   * This is the point on the anchor where the popover's
   * `anchorEl` will attach to. This is not used when the
   * anchorReference is 'anchorPosition'.
   *
   * Options:
   * vertical: [top, center, bottom];
   * horizontal: [left, center, right].
   */
  anchorOrigin: _propTypes.default.shape({
    horizontal: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.oneOf(['left', 'center', 'right'])]).isRequired,
    vertical: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.oneOf(['top', 'center', 'bottom'])]).isRequired
  }),

  /**
   * This is the position that may be used
   * to set the position of the popover.
   * The coordinates are relative to
   * the application's client area.
   */
  anchorPosition: _propTypes.default.shape({
    left: _propTypes.default.number.isRequired,
    top: _propTypes.default.number.isRequired
  }),

  /*
   * This determines which anchor prop to refer to to set
   * the position of the popover.
   */
  anchorReference: _propTypes.default.oneOf(['anchorEl', 'anchorPosition', 'none']),

  /**
   * The content of the component.
   */
  children: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * A node, component instance, or function that returns either.
   * The `container` will passed to the Modal component.
   * By default, it uses the body of the anchorEl's top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.func]),

  /**
   * The elevation of the popover.
   */
  elevation: _propTypes.default.number,

  /**
   * This function is called in order to retrieve the content anchor element.
   * It's the opposite of the `anchorEl` property.
   * The content anchor element should be an element inside the popover.
   * It's used to correctly scroll and set the position of the popover.
   * The positioning strategy tries to make the content anchor element just above the
   * anchor element.
   */
  getContentAnchorEl: _propTypes.default.func,

  /**
   * Specifies how close to the edge of the window the popover can appear.
   */
  marginThreshold: _propTypes.default.number,

  /**
   * `classes` property applied to the [`Modal`](/api/modal/) element.
   */
  ModalClasses: _propTypes.default.object,

  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback.
   * @param {string} reason Can be:`"escapeKeyDown"`, `"backdropClick"`
   */
  onClose: _propTypes.default.func,

  /**
   * Callback fired before the component is entering.
   */
  onEnter: _propTypes.default.func,

  /**
   * Callback fired when the component has entered.
   */
  onEntered: _propTypes.default.func,

  /**
   * Callback fired when the component is entering.
   */
  onEntering: _propTypes.default.func,

  /**
   * Callback fired before the component is exiting.
   */
  onExit: _propTypes.default.func,

  /**
   * Callback fired when the component has exited.
   */
  onExited: _propTypes.default.func,

  /**
   * Callback fired when the component is exiting.
   */
  onExiting: _propTypes.default.func,

  /**
   * If `true`, the popover is visible.
   */
  open: _propTypes.default.bool.isRequired,

  /**
   * Properties applied to the [`Paper`](/api/paper/) element.
   */
  PaperProps: _propTypes.default.object,

  /**
   * @ignore
   */
  role: _propTypes.default.string,

  /**
   * This is the point on the popover which
   * will attach to the anchor's origin.
   *
   * Options:
   * vertical: [top, center, bottom, x(px)];
   * horizontal: [left, center, right, x(px)].
   */
  transformOrigin: _propTypes.default.shape({
    horizontal: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.oneOf(['left', 'center', 'right'])]).isRequired,
    vertical: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.oneOf(['top', 'center', 'bottom'])]).isRequired
  }),

  /**
   * The component used for the transition.
   */
  TransitionComponent: _utils.componentPropType,

  /**
   * Set to 'auto' to automatically calculate transition time based on height.
   */
  transitionDuration: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  }), _propTypes.default.oneOf(['auto'])]),

  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: _propTypes.default.object
} : void 0;
Popover.defaultProps = {
  anchorReference: 'anchorEl',
  anchorOrigin: {
    vertical: 'top',
    horizontal: 'left'
  },
  elevation: 8,
  marginThreshold: 16,
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left'
  },
  TransitionComponent: _Grow.default,
  transitionDuration: 'auto'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiPopover'
})(Popover);

exports.default = _default;