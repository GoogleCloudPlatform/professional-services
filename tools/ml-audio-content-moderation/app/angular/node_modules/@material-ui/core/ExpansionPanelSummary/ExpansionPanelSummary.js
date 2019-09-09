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

var _ButtonBase = _interopRequireDefault(require("../ButtonBase"));

var _IconButton = _interopRequireDefault(require("../IconButton"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

// @inheritedComponent ButtonBase
var styles = function styles(theme) {
  var transition = {
    duration: theme.transitions.duration.shortest
  };
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'flex',
      minHeight: 8 * 6,
      transition: theme.transitions.create(['min-height', 'background-color'], transition),
      padding: '0 24px 0 24px',
      '&:hover:not($disabled)': {
        cursor: 'pointer'
      },
      '&$expanded': {
        minHeight: 64
      },
      '&$focused': {
        backgroundColor: theme.palette.grey[300]
      },
      '&$disabled': {
        opacity: 0.38
      }
    },

    /* Styles applied to the root element if `expanded={true}`. */
    expanded: {},

    /* Styles applied to the root and children wrapper elements when focused. */
    focused: {},

    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},

    /* Styles applied to the children wrapper element. */
    content: {
      display: 'flex',
      flexGrow: 1,
      transition: theme.transitions.create(['margin'], transition),
      margin: '12px 0',
      '& > :last-child': {
        paddingRight: 32
      },
      '&$expanded': {
        margin: '20px 0'
      }
    },

    /* Styles applied to the `IconButton` component when `expandIcon` is supplied. */
    expandIcon: {
      position: 'absolute',
      top: '50%',
      right: 8,
      transform: 'translateY(-50%) rotate(0deg)',
      transition: theme.transitions.create('transform', transition),
      '&:hover': {
        // Disable the hover effect for the IconButton,
        // because a hover effect should apply to the entire Expand button and
        // not only to the IconButton.
        backgroundColor: 'transparent'
      },
      '&$expanded': {
        transform: 'translateY(-50%) rotate(180deg)'
      }
    }
  };
};

exports.styles = styles;

var ExpansionPanelSummary =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(ExpansionPanelSummary, _React$Component);

  function ExpansionPanelSummary() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, ExpansionPanelSummary);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(ExpansionPanelSummary)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.state = {
      focused: false
    };

    _this.handleFocusVisible = function (event) {
      _this.setState({
        focused: true
      });

      if (_this.props.onFocusVisible) {
        _this.props.onFocusVisible(event);
      }
    };

    _this.handleBlur = function (event) {
      _this.setState({
        focused: false
      });

      if (_this.props.onBlur) {
        _this.props.onBlur(event);
      }
    };

    _this.handleChange = function (event) {
      var _this$props = _this.props,
          onChange = _this$props.onChange,
          onClick = _this$props.onClick;

      if (onChange) {
        onChange(event);
      }

      if (onClick) {
        onClick(event);
      }
    };

    return _this;
  }

  (0, _createClass2.default)(ExpansionPanelSummary, [{
    key: "render",
    value: function render() {
      var _classNames;

      var _this$props2 = this.props,
          children = _this$props2.children,
          classes = _this$props2.classes,
          className = _this$props2.className,
          disabled = _this$props2.disabled,
          expanded = _this$props2.expanded,
          expandIcon = _this$props2.expandIcon,
          IconButtonProps = _this$props2.IconButtonProps,
          onBlur = _this$props2.onBlur,
          onChange = _this$props2.onChange,
          onClick = _this$props2.onClick,
          onFocusVisible = _this$props2.onFocusVisible,
          other = (0, _objectWithoutProperties2.default)(_this$props2, ["children", "classes", "className", "disabled", "expanded", "expandIcon", "IconButtonProps", "onBlur", "onChange", "onClick", "onFocusVisible"]);
      var focused = this.state.focused;
      return _react.default.createElement(_ButtonBase.default, (0, _extends2.default)({
        focusRipple: false,
        disableRipple: true,
        disabled: disabled,
        component: "div",
        "aria-expanded": expanded,
        className: (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.disabled, disabled), (0, _defineProperty2.default)(_classNames, classes.expanded, expanded), (0, _defineProperty2.default)(_classNames, classes.focused, focused), _classNames), className),
        onFocusVisible: this.handleFocusVisible,
        onBlur: this.handleBlur,
        onClick: this.handleChange
      }, other), _react.default.createElement("div", {
        className: (0, _classnames.default)(classes.content, (0, _defineProperty2.default)({}, classes.expanded, expanded))
      }, children), expandIcon && _react.default.createElement(_IconButton.default, (0, _extends2.default)({
        disabled: disabled,
        className: (0, _classnames.default)(classes.expandIcon, (0, _defineProperty2.default)({}, classes.expanded, expanded)),
        component: "div",
        tabIndex: -1,
        "aria-hidden": "true"
      }, IconButtonProps), expandIcon));
    }
  }]);
  return ExpansionPanelSummary;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? ExpansionPanelSummary.propTypes = {
  /**
   * The content of the expansion panel summary.
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
   * @ignore
   * If `true`, the summary will be displayed in a disabled state.
   */
  disabled: _propTypes.default.bool,

  /**
   * @ignore
   * If `true`, expands the summary, otherwise collapse it.
   */
  expanded: _propTypes.default.bool,

  /**
   * The icon to display as the expand indicator.
   */
  expandIcon: _propTypes.default.node,

  /**
   * Properties applied to the `TouchRipple` element wrapping the expand icon.
   */
  IconButtonProps: _propTypes.default.object,

  /**
   * @ignore
   */
  onBlur: _propTypes.default.func,

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
  onFocusVisible: _propTypes.default.func
} : void 0;
ExpansionPanelSummary.defaultProps = {
  disabled: false
};
ExpansionPanelSummary.muiName = 'ExpansionPanelSummary';

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiExpansionPanelSummary'
})(ExpansionPanelSummary);

exports.default = _default;