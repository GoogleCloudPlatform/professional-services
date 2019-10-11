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

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _utils2 = require("../InputBase/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _helpers = require("../utils/helpers");

var _reactHelpers = require("../utils/reactHelpers");

var _FormControlContext = _interopRequireDefault(require("./FormControlContext"));

var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    position: 'relative',
    // Reset fieldset default style.
    minWidth: 0,
    padding: 0,
    margin: 0,
    border: 0,
    verticalAlign: 'top' // Fix alignment issue on Safari.

  },

  /* Styles applied to the root element if `margin="normal"`. */
  marginNormal: {
    marginTop: 16,
    marginBottom: 8
  },

  /* Styles applied to the root element if `margin="dense"`. */
  marginDense: {
    marginTop: 8,
    marginBottom: 4
  },

  /* Styles applied to the root element if `fullWidth={true}`. */
  fullWidth: {
    width: '100%'
  }
};
/**
 * Provides context such as filled/focused/error/required for form inputs.
 * Relying on the context provides high flexibility and ensures that the state always stays
 * consistent across the children of the `FormControl`.
 * This context is used by the following components:
 *  - FormLabel
 *  - FormHelperText
 *  - Input
 *  - InputLabel
 *
 * ⚠️ Only one input can be used within a FormControl.
 */

exports.styles = styles;

var FormControl =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(FormControl, _React$Component);
  (0, _createClass2.default)(FormControl, null, [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, state) {
      if (props.disabled && state.focused) {
        return {
          focused: false
        };
      }

      return null;
    }
  }]);

  function FormControl(props) {
    var _this;

    (0, _classCallCheck2.default)(this, FormControl);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(FormControl).call(this));

    _this.handleFocus = function () {
      _this.setState(function (state) {
        return !state.focused ? {
          focused: true
        } : null;
      });
    };

    _this.handleBlur = function () {
      _this.setState(function (state) {
        return state.focused ? {
          focused: false
        } : null;
      });
    };

    _this.handleDirty = function () {
      if (!_this.state.filled) {
        _this.setState({
          filled: true
        });
      }
    };

    _this.handleClean = function () {
      if (_this.state.filled) {
        _this.setState({
          filled: false
        });
      }
    };

    _this.state = {
      adornedStart: false,
      filled: false,
      focused: false
    }; // We need to iterate through the children and find the Input in order
    // to fully support server-side rendering.

    var children = props.children;

    if (children) {
      _react.default.Children.forEach(children, function (child) {
        if (!(0, _reactHelpers.isMuiElement)(child, ['Input', 'Select'])) {
          return;
        }

        if ((0, _utils2.isFilled)(child.props, true)) {
          _this.state.filled = true;
        }

        var input = (0, _reactHelpers.isMuiElement)(child, ['Select']) ? child.props.input : child;

        if (input && (0, _utils2.isAdornedStart)(input.props)) {
          _this.state.adornedStart = true;
        }
      });
    }

    return _this;
  }

  (0, _createClass2.default)(FormControl, [{
    key: "render",
    value: function render() {
      var _classNames;

      var _this$props = this.props,
          classes = _this$props.classes,
          className = _this$props.className,
          Component = _this$props.component,
          disabled = _this$props.disabled,
          error = _this$props.error,
          fullWidth = _this$props.fullWidth,
          margin = _this$props.margin,
          required = _this$props.required,
          variant = _this$props.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["classes", "className", "component", "disabled", "error", "fullWidth", "margin", "required", "variant"]);
      var _this$state = this.state,
          adornedStart = _this$state.adornedStart,
          filled = _this$state.filled,
          focused = _this$state.focused;
      var childContext = {
        adornedStart: adornedStart,
        disabled: disabled,
        error: error,
        filled: filled,
        focused: focused,
        margin: margin,
        onBlur: this.handleBlur,
        onEmpty: this.handleClean,
        onFilled: this.handleDirty,
        onFocus: this.handleFocus,
        required: required,
        variant: variant
      };
      return _react.default.createElement(_FormControlContext.default.Provider, {
        value: childContext
      }, _react.default.createElement(Component, (0, _extends2.default)({
        className: (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes["margin".concat((0, _helpers.capitalize)(margin))], margin !== 'none'), (0, _defineProperty2.default)(_classNames, classes.fullWidth, fullWidth), _classNames), className)
      }, other)));
    }
  }]);
  return FormControl;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? FormControl.propTypes = {
  /**
   * The contents of the form control.
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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * If `true`, the label, input and helper text should be displayed in a disabled state.
   */
  disabled: _propTypes.default.bool,

  /**
   * If `true`, the label should be displayed in an error state.
   */
  error: _propTypes.default.bool,

  /**
   * If `true`, the component will take up the full width of its container.
   */
  fullWidth: _propTypes.default.bool,

  /**
   * If `dense` or `normal`, will adjust vertical spacing of this and contained components.
   */
  margin: _propTypes.default.oneOf(['none', 'dense', 'normal']),

  /**
   * If `true`, the label will indicate that the input is required.
   */
  required: _propTypes.default.bool,

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['standard', 'outlined', 'filled'])
} : void 0;
FormControl.defaultProps = {
  component: 'div',
  disabled: false,
  error: false,
  fullWidth: false,
  margin: 'none',
  required: false,
  variant: 'standard'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiFormControl'
})(FormControl);

exports.default = _default;