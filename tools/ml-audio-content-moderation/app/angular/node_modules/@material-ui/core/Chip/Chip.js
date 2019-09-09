"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

var _warning = _interopRequireDefault(require("warning"));

var _utils = require("@material-ui/utils");

var _Cancel = _interopRequireDefault(require("../internal/svg-icons/Cancel"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _colorManipulator = require("../styles/colorManipulator");

var _unsupportedProp = _interopRequireDefault(require("../utils/unsupportedProp"));

var _helpers = require("../utils/helpers");

require("../Avatar/Avatar");

// So we don't have any override priority issue.
var styles = function styles(theme) {
  var height = 32;
  var backgroundColor = theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700];
  var deleteIconColor = (0, _colorManipulator.fade)(theme.palette.text.primary, 0.26);
  return {
    /* Styles applied to the root element. */
    root: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.pxToRem(13),
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: height,
      color: theme.palette.getContrastText(backgroundColor),
      backgroundColor: backgroundColor,
      borderRadius: height / 2,
      whiteSpace: 'nowrap',
      transition: theme.transitions.create(['background-color', 'box-shadow']),
      // label will inherit this from root, then `clickable` class overrides this for both
      cursor: 'default',
      // We disable the focus ring for mouse, touch and keyboard users.
      outline: 'none',
      textDecoration: 'none',
      border: 'none',
      // Remove `button` border
      padding: 0,
      // Remove `button` padding
      verticalAlign: 'middle',
      boxSizing: 'border-box'
    },

    /* Styles applied to the root element if `color="primary"`. */
    colorPrimary: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText
    },

    /* Styles applied to the root element if `color="secondary"`. */
    colorSecondary: {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText
    },

    /* Styles applied to the root element if `onClick` is defined or `clickable={true}`. */
    clickable: {
      WebkitTapHighlightColor: 'transparent',
      // Remove grey highlight
      cursor: 'pointer',
      '&:hover, &:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(backgroundColor, 0.08)
      },
      '&:active': {
        boxShadow: theme.shadows[1],
        backgroundColor: (0, _colorManipulator.emphasize)(backgroundColor, 0.12)
      }
    },

    /**
     * Styles applied to the root element if
     * `onClick` and `color="primary"` is defined or `clickable={true}`.
     */
    clickableColorPrimary: {
      '&:hover, &:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.primary.main, 0.08)
      },
      '&:active': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.primary.main, 0.12)
      }
    },

    /**
     * Styles applied to the root element if
     * `onClick` and `color="secondary"` is defined or `clickable={true}`.
     */
    clickableColorSecondary: {
      '&:hover, &:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.secondary.main, 0.08)
      },
      '&:active': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.secondary.main, 0.12)
      }
    },

    /* Styles applied to the root element if `onDelete` is defined. */
    deletable: {
      '&:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(backgroundColor, 0.08)
      }
    },

    /* Styles applied to the root element if `onDelete` and `color="primary"` is defined. */
    deletableColorPrimary: {
      '&:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.primary.main, 0.2)
      }
    },

    /* Styles applied to the root element if `onDelete` and `color="secondary"` is defined. */
    deletableColorSecondary: {
      '&:focus': {
        backgroundColor: (0, _colorManipulator.emphasize)(theme.palette.secondary.main, 0.2)
      }
    },

    /* Styles applied to the root element if `variant="outlined"`. */
    outlined: {
      backgroundColor: 'transparent',
      border: "1px solid ".concat(theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'),
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.text.primary, theme.palette.action.hoverOpacity)
      },
      '& $avatar': {
        marginLeft: -1
      }
    },

    /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
    outlinedPrimary: {
      color: theme.palette.primary.main,
      border: "1px solid ".concat(theme.palette.primary.main),
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.primary.main, theme.palette.action.hoverOpacity)
      }
    },

    /* Styles applied to the root element if `variant="outlined"` and `color="secondary"`. */
    outlinedSecondary: {
      color: theme.palette.secondary.main,
      border: "1px solid ".concat(theme.palette.secondary.main),
      '$clickable&:hover, $clickable&:focus, $deletable&:focus': {
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.secondary.main, theme.palette.action.hoverOpacity)
      }
    },

    /* Styles applied to the `avatar` element. */
    avatar: {
      marginRight: -4,
      width: height,
      height: height,
      color: theme.palette.type === 'light' ? theme.palette.grey[700] : theme.palette.grey[300],
      fontSize: theme.typography.pxToRem(16)
    },

    /* Styles applied to the `avatar` element if `color="primary"`. */
    avatarColorPrimary: {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.dark
    },

    /* Styles applied to the `avatar` element if `color="secondary"`. */
    avatarColorSecondary: {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.dark
    },

    /* Styles applied to the `avatar` elements children. */
    avatarChildren: {
      width: 19,
      height: 19
    },

    /* Styles applied to the `icon` element. */
    icon: {
      color: theme.palette.type === 'light' ? theme.palette.grey[700] : theme.palette.grey[300],
      marginLeft: 4,
      marginRight: -8
    },

    /* Styles applied to the `icon` element if `color="primary"`. */
    iconColorPrimary: {
      color: 'inherit'
    },

    /* Styles applied to the `icon` element if `color="secondary"`. */
    iconColorSecondary: {
      color: 'inherit'
    },

    /* Styles applied to the label `span` element`. */
    label: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 12,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      cursor: 'inherit'
    },

    /* Styles applied to the `deleteIcon` element. */
    deleteIcon: {
      // Remove grey highlight
      WebkitTapHighlightColor: 'transparent',
      color: deleteIconColor,
      cursor: 'pointer',
      height: 'auto',
      margin: '0 4px 0 -8px',
      '&:hover': {
        color: (0, _colorManipulator.fade)(deleteIconColor, 0.4)
      }
    },

    /* Styles applied to the deleteIcon element if `color="primary"` and `variant="default"`. */
    deleteIconColorPrimary: {
      color: (0, _colorManipulator.fade)(theme.palette.primary.contrastText, 0.7),
      '&:hover, &:active': {
        color: theme.palette.primary.contrastText
      }
    },

    /* Styles applied to the deleteIcon element if `color="secondary"` and `variant="default"`. */
    deleteIconColorSecondary: {
      color: (0, _colorManipulator.fade)(theme.palette.secondary.contrastText, 0.7),
      '&:hover, &:active': {
        color: theme.palette.secondary.contrastText
      }
    },

    /* Styles applied to the deleteIcon element if `color="primary"` and `variant="outlined"`. */
    deleteIconOutlinedColorPrimary: {
      color: (0, _colorManipulator.fade)(theme.palette.primary.main, 0.7),
      '&:hover, &:active': {
        color: theme.palette.primary.main
      }
    },

    /* Styles applied to the deleteIcon element if `color="secondary"` and `variant="outlined"`. */
    deleteIconOutlinedColorSecondary: {
      color: (0, _colorManipulator.fade)(theme.palette.secondary.main, 0.7),
      '&:hover, &:active': {
        color: theme.palette.secondary.main
      }
    }
  };
};
/**
 * Chips represent complex entities in small blocks, such as a contact.
 */


exports.styles = styles;

var Chip =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Chip, _React$Component);

  function Chip() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Chip);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Chip)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleDeleteIconClick = function (event) {
      // Stop the event from bubbling up to the `Chip`
      event.stopPropagation();
      var onDelete = _this.props.onDelete;

      if (onDelete) {
        onDelete(event);
      }
    };

    _this.handleKeyDown = function (event) {
      var onKeyDown = _this.props.onKeyDown;

      if (onKeyDown) {
        onKeyDown(event);
      } // Ignore events from children of `Chip`.


      if (event.currentTarget !== event.target) {
        return;
      }

      var key = event.key;

      if (key === ' ' || key === 'Enter' || key === 'Backspace' || key === 'Escape') {
        event.preventDefault();
      }
    };

    _this.handleKeyUp = function (event) {
      var _this$props = _this.props,
          onClick = _this$props.onClick,
          onDelete = _this$props.onDelete,
          onKeyUp = _this$props.onKeyUp;

      if (onKeyUp) {
        onKeyUp(event);
      } // Ignore events from children of `Chip`.


      if (event.currentTarget !== event.target) {
        return;
      }

      var key = event.key;

      if (onClick && (key === ' ' || key === 'Enter')) {
        onClick(event);
      } else if (onDelete && key === 'Backspace') {
        onDelete(event);
      } else if (key === 'Escape' && _this.chipRef) {
        _this.chipRef.blur();
      }
    };

    return _this;
  }

  (0, _createClass2.default)(Chip, [{
    key: "render",
    value: function render() {
      var _classNames,
          _this2 = this;

      var _this$props2 = this.props,
          avatarProp = _this$props2.avatar,
          classes = _this$props2.classes,
          classNameProp = _this$props2.className,
          clickableProp = _this$props2.clickable,
          color = _this$props2.color,
          Component = _this$props2.component,
          deleteIconProp = _this$props2.deleteIcon,
          iconProp = _this$props2.icon,
          label = _this$props2.label,
          onClick = _this$props2.onClick,
          onDelete = _this$props2.onDelete,
          onKeyDown = _this$props2.onKeyDown,
          onKeyUp = _this$props2.onKeyUp,
          tabIndexProp = _this$props2.tabIndex,
          variant = _this$props2.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props2, ["avatar", "classes", "className", "clickable", "color", "component", "deleteIcon", "icon", "label", "onClick", "onDelete", "onKeyDown", "onKeyUp", "tabIndex", "variant"]);
      var clickable = clickableProp !== false && onClick ? true : clickableProp;
      var className = (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes["color".concat((0, _helpers.capitalize)(color))], color !== 'default'), (0, _defineProperty2.default)(_classNames, classes.clickable, clickable), (0, _defineProperty2.default)(_classNames, classes["clickableColor".concat((0, _helpers.capitalize)(color))], clickable && color !== 'default'), (0, _defineProperty2.default)(_classNames, classes.deletable, onDelete), (0, _defineProperty2.default)(_classNames, classes["deletableColor".concat((0, _helpers.capitalize)(color))], onDelete && color !== 'default'), (0, _defineProperty2.default)(_classNames, classes.outlined, variant === 'outlined'), (0, _defineProperty2.default)(_classNames, classes.outlinedPrimary, variant === 'outlined' && color === 'primary'), (0, _defineProperty2.default)(_classNames, classes.outlinedSecondary, variant === 'outlined' && color === 'secondary'), _classNames), classNameProp);
      var deleteIcon = null;

      if (onDelete) {
        var _customClasses;

        var customClasses = (_customClasses = {}, (0, _defineProperty2.default)(_customClasses, classes["deleteIconColor".concat((0, _helpers.capitalize)(color))], color !== 'default' && variant !== 'outlined'), (0, _defineProperty2.default)(_customClasses, classes["deleteIconOutlinedColor".concat((0, _helpers.capitalize)(color))], color !== 'default' && variant === 'outlined'), _customClasses);
        deleteIcon = deleteIconProp && _react.default.isValidElement(deleteIconProp) ? _react.default.cloneElement(deleteIconProp, {
          className: (0, _classnames.default)(deleteIconProp.props.className, classes.deleteIcon, customClasses),
          onClick: this.handleDeleteIconClick
        }) : _react.default.createElement(_Cancel.default, {
          className: (0, _classnames.default)(classes.deleteIcon, customClasses),
          onClick: this.handleDeleteIconClick
        });
      }

      var avatar = null;

      if (avatarProp && _react.default.isValidElement(avatarProp)) {
        avatar = _react.default.cloneElement(avatarProp, {
          className: (0, _classnames.default)(classes.avatar, avatarProp.props.className, (0, _defineProperty2.default)({}, classes["avatarColor".concat((0, _helpers.capitalize)(color))], color !== 'default')),
          childrenClassName: (0, _classnames.default)(classes.avatarChildren, avatarProp.props.childrenClassName)
        });
      }

      var icon = null;

      if (iconProp && _react.default.isValidElement(iconProp)) {
        icon = _react.default.cloneElement(iconProp, {
          className: (0, _classnames.default)(classes.icon, iconProp.props.className, (0, _defineProperty2.default)({}, classes["iconColor".concat((0, _helpers.capitalize)(color))], color !== 'default'))
        });
      }

      var tabIndex = tabIndexProp;

      if (!tabIndex) {
        tabIndex = onClick || onDelete || clickable ? 0 : -1;
      }

      process.env.NODE_ENV !== "production" ? (0, _warning.default)(!avatar || !icon, 'Material-UI: the Chip component can not handle the avatar ' + 'and the icon property at the same time. Pick one.') : void 0;
      return _react.default.createElement(Component, (0, _extends2.default)({
        role: "button",
        className: className,
        tabIndex: tabIndex,
        onClick: onClick,
        onKeyDown: this.handleKeyDown,
        onKeyUp: this.handleKeyUp,
        ref: function ref(_ref) {
          _this2.chipRef = _ref;
        }
      }, other), avatar || icon, _react.default.createElement("span", {
        className: classes.label
      }, label), deleteIcon);
    }
  }]);
  return Chip;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Chip.propTypes = {
  /**
   * Avatar element.
   */
  avatar: _propTypes.default.element,

  /**
   * This property isn't supported.
   * Use the `component` property if you need to change the children structure.
   */
  children: _unsupportedProp.default,

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
   * If true, the chip will appear clickable, and will raise when pressed,
   * even if the onClick property is not defined.
   * If false, the chip will not be clickable, even if onClick property is defined.
   * This can be used, for example,
   * along with the component property to indicate an anchor Chip is clickable.
   */
  clickable: _propTypes.default.bool,

  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: _propTypes.default.oneOf(['default', 'primary', 'secondary']),

  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * Override the default delete icon element. Shown only if `onDelete` is set.
   */
  deleteIcon: _propTypes.default.element,

  /**
   * Icon element.
   */
  icon: _propTypes.default.element,

  /**
   * The content of the label.
   */
  label: _propTypes.default.node,

  /**
   * @ignore
   */
  onClick: _propTypes.default.func,

  /**
   * Callback function fired when the delete icon is clicked.
   * If set, the delete icon will be shown.
   */
  onDelete: _propTypes.default.func,

  /**
   * @ignore
   */
  onKeyDown: _propTypes.default.func,

  /**
   * @ignore
   */
  onKeyUp: _propTypes.default.func,

  /**
   * @ignore
   */
  tabIndex: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string]),

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['default', 'outlined'])
} : void 0;
Chip.defaultProps = {
  component: 'div',
  color: 'default',
  variant: 'default'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiChip'
})(Chip);

exports.default = _default;