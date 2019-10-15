"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHorizontal = isHorizontal;
exports.getAnchor = getAnchor;
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _Modal = _interopRequireDefault(require("../Modal"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Slide = _interopRequireDefault(require("../Slide"));

var _Paper = _interopRequireDefault(require("../Paper"));

var _helpers = require("../utils/helpers");

var _transitions = require("../styles/transitions");

var oppositeDirection = {
  left: 'right',
  right: 'left',
  top: 'down',
  bottom: 'up'
};

function isHorizontal(props) {
  return ['left', 'right'].indexOf(props.anchor) !== -1;
}

function getAnchor(props) {
  return props.theme.direction === 'rtl' && isHorizontal(props) ? oppositeDirection[props.anchor] : props.anchor;
}

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {},

    /* Styles applied to the root element if `variant="permanent or persistent"`. */
    docked: {
      flex: '0 0 auto'
    },

    /* Styles applied to the `Paper` component. */
    paper: {
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flex: '1 0 auto',
      zIndex: theme.zIndex.drawer,
      WebkitOverflowScrolling: 'touch',
      // Add iOS momentum scrolling.
      // temporary style
      position: 'fixed',
      top: 0,
      // We disable the focus ring for mouse, touch and keyboard users.
      // At some point, it would be better to keep it for keyboard users.
      // :focus-ring CSS pseudo-class will help.
      outline: 'none'
    },

    /* Styles applied to the `Paper` component if `anchor="left"`. */
    paperAnchorLeft: {
      left: 0,
      right: 'auto'
    },

    /* Styles applied to the `Paper` component if `anchor="right"`. */
    paperAnchorRight: {
      left: 'auto',
      right: 0
    },

    /* Styles applied to the `Paper` component if `anchor="top"`. */
    paperAnchorTop: {
      top: 0,
      left: 0,
      bottom: 'auto',
      right: 0,
      height: 'auto',
      maxHeight: '100%'
    },

    /* Styles applied to the `Paper` component if `anchor="bottom"`. */
    paperAnchorBottom: {
      top: 'auto',
      left: 0,
      bottom: 0,
      right: 0,
      height: 'auto',
      maxHeight: '100%'
    },

    /* Styles applied to the `Paper` component if `anchor="left"` & `variant` is not "temporary". */
    paperAnchorDockedLeft: {
      borderRight: "1px solid ".concat(theme.palette.divider)
    },

    /* Styles applied to the `Paper` component if `anchor="top"` & `variant` is not "temporary". */
    paperAnchorDockedTop: {
      borderBottom: "1px solid ".concat(theme.palette.divider)
    },

    /* Styles applied to the `Paper` component if `anchor="right"` & `variant` is not "temporary". */
    paperAnchorDockedRight: {
      borderLeft: "1px solid ".concat(theme.palette.divider)
    },

    /* Styles applied to the `Paper` component if `anchor="bottom"` & `variant` is not "temporary". */
    paperAnchorDockedBottom: {
      borderTop: "1px solid ".concat(theme.palette.divider)
    },

    /* Styles applied to the `Modal` component. */
    modal: {}
  };
};
/**
 * The properties of the [Modal](/api/modal/) component are available
 * when `variant="temporary"` is set.
 */


exports.styles = styles;

var Drawer =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Drawer, _React$Component);

  function Drawer() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Drawer);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Drawer)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.mounted = false;
    return _this;
  }

  (0, _createClass2.default)(Drawer, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.mounted = true;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          anchorProp = _this$props.anchor,
          BackdropProps = _this$props.BackdropProps,
          children = _this$props.children,
          classes = _this$props.classes,
          className = _this$props.className,
          elevation = _this$props.elevation,
          _this$props$ModalProp = _this$props.ModalProps;
      _this$props$ModalProp = _this$props$ModalProp === void 0 ? {} : _this$props$ModalProp;
      var BackdropPropsProp = _this$props$ModalProp.BackdropProps,
          ModalProps = (0, _objectWithoutProperties2.default)(_this$props$ModalProp, ["BackdropProps"]),
          onClose = _this$props.onClose,
          open = _this$props.open,
          PaperProps = _this$props.PaperProps,
          SlideProps = _this$props.SlideProps,
          theme = _this$props.theme,
          transitionDuration = _this$props.transitionDuration,
          variant = _this$props.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["anchor", "BackdropProps", "children", "classes", "className", "elevation", "ModalProps", "onClose", "open", "PaperProps", "SlideProps", "theme", "transitionDuration", "variant"]);
      var anchor = getAnchor(this.props);

      var drawer = _react.default.createElement(_Paper.default, (0, _extends2.default)({
        elevation: variant === 'temporary' ? elevation : 0,
        square: true,
        className: (0, _classnames.default)(classes.paper, classes["paperAnchor".concat((0, _helpers.capitalize)(anchor))], (0, _defineProperty2.default)({}, classes["paperAnchorDocked".concat((0, _helpers.capitalize)(anchor))], variant !== 'temporary'))
      }, PaperProps), children);

      if (variant === 'permanent') {
        return _react.default.createElement("div", (0, _extends2.default)({
          className: (0, _classnames.default)(classes.root, classes.docked, className)
        }, other), drawer);
      }

      var slidingDrawer = _react.default.createElement(_Slide.default, (0, _extends2.default)({
        in: open,
        direction: oppositeDirection[anchor],
        timeout: transitionDuration,
        appear: this.mounted
      }, SlideProps), drawer);

      if (variant === 'persistent') {
        return _react.default.createElement("div", (0, _extends2.default)({
          className: (0, _classnames.default)(classes.root, classes.docked, className)
        }, other), slidingDrawer);
      } // variant === temporary


      return _react.default.createElement(_Modal.default, (0, _extends2.default)({
        BackdropProps: (0, _extends2.default)({}, BackdropProps, BackdropPropsProp, {
          transitionDuration: transitionDuration
        }),
        className: (0, _classnames.default)(classes.root, classes.modal, className),
        open: open,
        onClose: onClose
      }, other, ModalProps), slidingDrawer);
    }
  }]);
  return Drawer;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Drawer.propTypes = {
  /**
   * Side from which the drawer will appear.
   */
  anchor: _propTypes.default.oneOf(['left', 'top', 'right', 'bottom']),

  /**
   * @ignore
   */
  BackdropProps: _propTypes.default.object,

  /**
   * The contents of the drawer.
   */
  children: _propTypes.default.node,

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
   * The elevation of the drawer.
   */
  elevation: _propTypes.default.number,

  /**
   * Properties applied to the [`Modal`](/api/modal/) element.
   */
  ModalProps: _propTypes.default.object,

  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback
   */
  onClose: _propTypes.default.func,

  /**
   * If `true`, the drawer is open.
   */
  open: _propTypes.default.bool,

  /**
   * Properties applied to the [`Paper`](/api/paper/) element.
   */
  PaperProps: _propTypes.default.object,

  /**
   * Properties applied to the [`Slide`](/api/slide/) element.
   */
  SlideProps: _propTypes.default.object,

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
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['permanent', 'persistent', 'temporary'])
} : void 0;
Drawer.defaultProps = {
  anchor: 'left',
  elevation: 16,
  open: false,
  transitionDuration: {
    enter: _transitions.duration.enteringScreen,
    exit: _transitions.duration.leavingScreen
  },
  variant: 'temporary' // Mobile first.

};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiDrawer',
  flip: false,
  withTheme: true
})(Drawer);

exports.default = _default;