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

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _ButtonBase = _interopRequireDefault(require("../ButtonBase"));

var _unsupportedProp = _interopRequireDefault(require("../utils/unsupportedProp"));

// @inheritedComponent ButtonBase
var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      transition: theme.transitions.create(['color', 'padding-top'], {
        duration: theme.transitions.duration.short
      }),
      padding: '6px 12px 8px',
      minWidth: 80,
      maxWidth: 168,
      color: theme.palette.text.secondary,
      flex: '1',
      '&$iconOnly': {
        paddingTop: 16
      },
      '&$selected': {
        paddingTop: 6,
        color: theme.palette.primary.main
      }
    },

    /* Styles applied to the root element if selected. */
    selected: {},

    /* Styles applied to the root element if `showLabel={false}` and not selected. */
    iconOnly: {},

    /* Styles applied to the span element that wraps the icon and label. */
    wrapper: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      flexDirection: 'column'
    },

    /* Styles applied to the label's span element. */
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.pxToRem(12),
      opacity: 1,
      transition: 'font-size 0.2s, opacity 0.2s',
      transitionDelay: '0.1s',
      '&$iconOnly': {
        opacity: 0,
        transitionDelay: '0s'
      },
      '&$selected': {
        fontSize: theme.typography.pxToRem(14)
      }
    }
  };
};

exports.styles = styles;

var BottomNavigationAction =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(BottomNavigationAction, _React$Component);

  function BottomNavigationAction() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, BottomNavigationAction);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(BottomNavigationAction)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleChange = function (event) {
      var _this$props = _this.props,
          onChange = _this$props.onChange,
          value = _this$props.value,
          onClick = _this$props.onClick;

      if (onChange) {
        onChange(event, value);
      }

      if (onClick) {
        onClick(event);
      }
    };

    return _this;
  }

  (0, _createClass2.default)(BottomNavigationAction, [{
    key: "render",
    value: function render() {
      var _classNames, _classNames2;

      var _this$props2 = this.props,
          classes = _this$props2.classes,
          classNameProp = _this$props2.className,
          icon = _this$props2.icon,
          label = _this$props2.label,
          onChange = _this$props2.onChange,
          onClick = _this$props2.onClick,
          selected = _this$props2.selected,
          showLabelProp = _this$props2.showLabel,
          value = _this$props2.value,
          other = (0, _objectWithoutProperties2.default)(_this$props2, ["classes", "className", "icon", "label", "onChange", "onClick", "selected", "showLabel", "value"]);
      var className = (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.selected, selected), (0, _defineProperty2.default)(_classNames, classes.iconOnly, !showLabelProp && !selected), _classNames), classNameProp);
      var labelClassName = (0, _classnames.default)(classes.label, (_classNames2 = {}, (0, _defineProperty2.default)(_classNames2, classes.selected, selected), (0, _defineProperty2.default)(_classNames2, classes.iconOnly, !showLabelProp && !selected), _classNames2));
      return _react.default.createElement(_ButtonBase.default, (0, _extends2.default)({
        className: className,
        focusRipple: true,
        onClick: this.handleChange
      }, other), _react.default.createElement("span", {
        className: classes.wrapper
      }, icon, _react.default.createElement("span", {
        className: labelClassName
      }, label)));
    }
  }]);
  return BottomNavigationAction;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? BottomNavigationAction.propTypes = {
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
   * The icon element.
   */
  icon: _propTypes.default.node,

  /**
   * The label element.
   */
  label: _propTypes.default.node,

  /**
   * @ignore
   */
  onChange: _propTypes.default.func,

  /**
   * @ignore
   */
  onClick: _propTypes.default.func,

  /**
   * @ignore
   */
  selected: _propTypes.default.bool,

  /**
   * If `true`, the `BottomNavigationAction` will show its label.
   * By default, only the selected `BottomNavigationAction`
   * inside `BottomNavigation` will show its label.
   */
  showLabel: _propTypes.default.bool,

  /**
   * You can provide your own value. Otherwise, we fallback to the child position index.
   */
  value: _propTypes.default.any
} : void 0;

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiBottomNavigationAction'
})(BottomNavigationAction);

exports.default = _default;