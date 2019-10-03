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

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _helpers = require("../utils/helpers");

var _Modal = _interopRequireDefault(require("../Modal"));

var _Fade = _interopRequireDefault(require("../Fade"));

var _transitions = require("../styles/transitions");

var _Paper = _interopRequireDefault(require("../Paper"));

/* eslint-disable jsx-a11y/click-events-have-key-events */

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
// @inheritedComponent Modal
var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {},

    /* Styles applied to the root element if `scroll="paper"`. */
    scrollPaper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },

    /* Styles applied to the root element if `scroll="body"`. */
    scrollBody: {
      overflowY: 'auto',
      overflowX: 'hidden'
    },

    /* Styles applied to the container element. */
    container: {
      height: '100%',
      // We disable the focus ring for mouse, touch and keyboard users.
      outline: 'none'
    },

    /* Styles applied to the `Paper` component. */
    paper: {
      display: 'flex',
      flexDirection: 'column',
      margin: 48,
      position: 'relative',
      overflowY: 'auto' // Fix IE 11 issue, to remove at some point.

    },

    /* Styles applied to the `Paper` component if `scroll="paper"`. */
    paperScrollPaper: {
      flex: '0 1 auto',
      maxHeight: 'calc(100% - 96px)'
    },

    /* Styles applied to the `Paper` component if `scroll="body"`. */
    paperScrollBody: {
      margin: '48px auto'
    },

    /* Styles applied to the `Paper` component if `maxWidth="xs"`. */
    paperWidthXs: {
      maxWidth: Math.max(theme.breakpoints.values.xs, 360),
      '&$paperScrollBody': (0, _defineProperty2.default)({}, theme.breakpoints.down(Math.max(theme.breakpoints.values.xs, 360) + 48 * 2), {
        margin: 48
      })
    },

    /* Styles applied to the `Paper` component if `maxWidth="sm"`. */
    paperWidthSm: {
      maxWidth: theme.breakpoints.values.sm,
      '&$paperScrollBody': (0, _defineProperty2.default)({}, theme.breakpoints.down(theme.breakpoints.values.sm + 48 * 2), {
        margin: 48
      })
    },

    /* Styles applied to the `Paper` component if `maxWidth="md"`. */
    paperWidthMd: {
      maxWidth: theme.breakpoints.values.md,
      '&$paperScrollBody': (0, _defineProperty2.default)({}, theme.breakpoints.down(theme.breakpoints.values.md + 48 * 2), {
        margin: 48
      })
    },

    /* Styles applied to the `Paper` component if `maxWidth="lg"`. */
    paperWidthLg: {
      maxWidth: theme.breakpoints.values.lg,
      '&$paperScrollBody': (0, _defineProperty2.default)({}, theme.breakpoints.down(theme.breakpoints.values.lg + 48 * 2), {
        margin: 48
      })
    },

    /* Styles applied to the `Paper` component if `maxWidth="xl"`. */
    paperWidthXl: {
      maxWidth: theme.breakpoints.values.xl,
      '&$paperScrollBody': (0, _defineProperty2.default)({}, theme.breakpoints.down(theme.breakpoints.values.xl + 48 * 2), {
        margin: 48
      })
    },

    /* Styles applied to the `Paper` component if `fullWidth={true}`. */
    paperFullWidth: {
      width: '100%'
    },

    /* Styles applied to the `Paper` component if `fullScreen={true}`. */
    paperFullScreen: {
      margin: 0,
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      maxHeight: 'none',
      borderRadius: 0,
      '&$paperScrollBody': {
        margin: 0
      }
    }
  };
};
/**
 * Dialogs are overlaid modal paper based components with a backdrop.
 */


exports.styles = styles;

var Dialog =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Dialog, _React$Component);

  function Dialog() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Dialog);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Dialog)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleMouseDown = function (event) {
      _this.mouseDownTarget = event.target;
    };

    _this.handleBackdropClick = function (event) {
      // Ignore the events not coming from the "backdrop"
      // We don't want to close the dialog when clicking the dialog content.
      if (event.target !== event.currentTarget) {
        return;
      } // Make sure the event starts and ends on the same DOM element.


      if (event.target !== _this.mouseDownTarget) {
        return;
      }

      _this.mouseDownTarget = null;

      if (_this.props.onBackdropClick) {
        _this.props.onBackdropClick(event);
      }

      if (!_this.props.disableBackdropClick && _this.props.onClose) {
        _this.props.onClose(event, 'backdropClick');
      }
    };

    return _this;
  }

  (0, _createClass2.default)(Dialog, [{
    key: "render",
    value: function render() {
      var _classNames;

      var _this$props = this.props,
          BackdropProps = _this$props.BackdropProps,
          children = _this$props.children,
          classes = _this$props.classes,
          className = _this$props.className,
          disableBackdropClick = _this$props.disableBackdropClick,
          disableEscapeKeyDown = _this$props.disableEscapeKeyDown,
          fullScreen = _this$props.fullScreen,
          fullWidth = _this$props.fullWidth,
          maxWidth = _this$props.maxWidth,
          onBackdropClick = _this$props.onBackdropClick,
          onClose = _this$props.onClose,
          onEnter = _this$props.onEnter,
          onEntered = _this$props.onEntered,
          onEntering = _this$props.onEntering,
          onEscapeKeyDown = _this$props.onEscapeKeyDown,
          onExit = _this$props.onExit,
          onExited = _this$props.onExited,
          onExiting = _this$props.onExiting,
          open = _this$props.open,
          PaperComponent = _this$props.PaperComponent,
          _this$props$PaperProp = _this$props.PaperProps,
          PaperProps = _this$props$PaperProp === void 0 ? {} : _this$props$PaperProp,
          scroll = _this$props.scroll,
          TransitionComponent = _this$props.TransitionComponent,
          transitionDuration = _this$props.transitionDuration,
          TransitionProps = _this$props.TransitionProps,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["BackdropProps", "children", "classes", "className", "disableBackdropClick", "disableEscapeKeyDown", "fullScreen", "fullWidth", "maxWidth", "onBackdropClick", "onClose", "onEnter", "onEntered", "onEntering", "onEscapeKeyDown", "onExit", "onExited", "onExiting", "open", "PaperComponent", "PaperProps", "scroll", "TransitionComponent", "transitionDuration", "TransitionProps"]);
      return _react.default.createElement(_Modal.default, (0, _extends2.default)({
        className: (0, _classnames.default)(classes.root, className),
        BackdropProps: (0, _extends2.default)({
          transitionDuration: transitionDuration
        }, BackdropProps),
        closeAfterTransition: true,
        disableBackdropClick: disableBackdropClick,
        disableEscapeKeyDown: disableEscapeKeyDown,
        onBackdropClick: onBackdropClick,
        onEscapeKeyDown: onEscapeKeyDown,
        onClose: onClose,
        open: open,
        role: "dialog"
      }, other), _react.default.createElement(TransitionComponent, (0, _extends2.default)({
        appear: true,
        in: open,
        timeout: transitionDuration,
        onEnter: onEnter,
        onEntering: onEntering,
        onEntered: onEntered,
        onExit: onExit,
        onExiting: onExiting,
        onExited: onExited
      }, TransitionProps), _react.default.createElement("div", {
        className: (0, _classnames.default)(classes.container, classes["scroll".concat((0, _helpers.capitalize)(scroll))]),
        onClick: this.handleBackdropClick,
        onMouseDown: this.handleMouseDown,
        role: "document"
      }, _react.default.createElement(PaperComponent, (0, _extends2.default)({
        elevation: 24
      }, PaperProps, {
        className: (0, _classnames.default)(classes.paper, classes["paperScroll".concat((0, _helpers.capitalize)(scroll))], (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes["paperWidth".concat(maxWidth ? (0, _helpers.capitalize)(maxWidth) : '')], maxWidth), (0, _defineProperty2.default)(_classNames, classes.paperFullScreen, fullScreen), (0, _defineProperty2.default)(_classNames, classes.paperFullWidth, fullWidth), _classNames), PaperProps.className)
      }), children))));
    }
  }]);
  return Dialog;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Dialog.propTypes = {
  /**
   * @ignore
   */
  BackdropProps: _propTypes.default.object,

  /**
   * Dialog children, usually the included sub-components.
   */
  children: _propTypes.default.node.isRequired,

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
   * If `true`, clicking the backdrop will not fire the `onClose` callback.
   */
  disableBackdropClick: _propTypes.default.bool,

  /**
   * If `true`, hitting escape will not fire the `onClose` callback.
   */
  disableEscapeKeyDown: _propTypes.default.bool,

  /**
   * If `true`, the dialog will be full-screen
   */
  fullScreen: _propTypes.default.bool,

  /**
   * If `true`, the dialog stretches to `maxWidth`.
   */
  fullWidth: _propTypes.default.bool,

  /**
   * Determine the max width of the dialog.
   * The dialog width grows with the size of the screen, this property is useful
   * on the desktop where you might need some coherent different width size across your
   * application. Set to `false` to disable `maxWidth`.
   */
  maxWidth: _propTypes.default.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),

  /**
   * Callback fired when the backdrop is clicked.
   */
  onBackdropClick: _propTypes.default.func,

  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback
   * @param {string} reason Can be:`"escapeKeyDown"`, `"backdropClick"`
   */
  onClose: _propTypes.default.func,

  /**
   * Callback fired before the dialog enters.
   */
  onEnter: _propTypes.default.func,

  /**
   * Callback fired when the dialog has entered.
   */
  onEntered: _propTypes.default.func,

  /**
   * Callback fired when the dialog is entering.
   */
  onEntering: _propTypes.default.func,

  /**
   * Callback fired when the escape key is pressed,
   * `disableKeyboard` is false and the modal is in focus.
   */
  onEscapeKeyDown: _propTypes.default.func,

  /**
   * Callback fired before the dialog exits.
   */
  onExit: _propTypes.default.func,

  /**
   * Callback fired when the dialog has exited.
   */
  onExited: _propTypes.default.func,

  /**
   * Callback fired when the dialog is exiting.
   */
  onExiting: _propTypes.default.func,

  /**
   * If `true`, the Dialog is open.
   */
  open: _propTypes.default.bool.isRequired,

  /**
   * The component used to render the body of the dialog.
   */
  PaperComponent: _utils.componentPropType,

  /**
   * Properties applied to the [`Paper`](/api/paper/) element.
   */
  PaperProps: _propTypes.default.object,

  /**
   * Determine the container for scrolling the dialog.
   */
  scroll: _propTypes.default.oneOf(['body', 'paper']),

  /**
   * The component used for the transition.
   */
  TransitionComponent: _utils.componentPropType,

  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  })]),

  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: _propTypes.default.object
} : void 0;
Dialog.defaultProps = {
  disableBackdropClick: false,
  disableEscapeKeyDown: false,
  fullScreen: false,
  fullWidth: false,
  maxWidth: 'sm',
  PaperComponent: _Paper.default,
  scroll: 'paper',
  TransitionComponent: _Fade.default,
  transitionDuration: {
    enter: _transitions.duration.enteringScreen,
    exit: _transitions.duration.leavingScreen
  }
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiDialog'
})(Dialog);

exports.default = _default;