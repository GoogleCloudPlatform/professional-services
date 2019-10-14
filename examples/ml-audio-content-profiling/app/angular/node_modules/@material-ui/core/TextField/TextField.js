"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _warning = _interopRequireDefault(require("warning"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Input = _interopRequireDefault(require("../Input"));

var _FilledInput = _interopRequireDefault(require("../FilledInput"));

var _OutlinedInput = _interopRequireDefault(require("../OutlinedInput"));

var _InputLabel = _interopRequireDefault(require("../InputLabel"));

var _FormControl = _interopRequireDefault(require("../FormControl"));

var _FormHelperText = _interopRequireDefault(require("../FormHelperText"));

var _Select = _interopRequireDefault(require("../Select"));

// @inheritedComponent FormControl
var variantComponent = {
  standard: _Input.default,
  filled: _FilledInput.default,
  outlined: _OutlinedInput.default
};
/**
 * The `TextField` is a convenience wrapper for the most common cases (80%).
 * It cannot be all things to all people, otherwise the API would grow out of control.
 *
 * ## Advanced Configuration
 *
 * It's important to understand that the text field is a simple abstraction
 * on top of the following components:
 * - [FormControl](/api/form-control/)
 * - [InputLabel](/api/input-label/)
 * - [Input](/api/input/)
 * - [FormHelperText](/api/form-helper-text/)
 *
 * If you wish to alter the properties applied to the native input, you can do so as follows:
 *
 * ```jsx
 * const inputProps = {
 *   step: 300,
 * };
 *
 * return <TextField id="time" type="time" inputProps={inputProps} />;
 * ```
 *
 * For advanced cases, please look at the source of TextField by clicking on the
 * "Edit this page" button above. Consider either:
 * - using the upper case props for passing values directly to the components
 * - using the underlying components directly as shown in the demos
 */

var TextField =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(TextField, _React$Component);

  function TextField(props) {
    var _this;

    (0, _classCallCheck2.default)(this, TextField);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(TextField).call(this, props));
    _this.labelRef = _react.default.createRef();
    return _this;
  }

  (0, _createClass2.default)(TextField, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.props.variant === 'outlined') {
        this.labelNode = _reactDom.default.findDOMNode(this.labelRef.current);
        this.forceUpdate();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          autoComplete = _this$props.autoComplete,
          autoFocus = _this$props.autoFocus,
          children = _this$props.children,
          className = _this$props.className,
          defaultValue = _this$props.defaultValue,
          error = _this$props.error,
          FormHelperTextProps = _this$props.FormHelperTextProps,
          fullWidth = _this$props.fullWidth,
          helperText = _this$props.helperText,
          id = _this$props.id,
          InputLabelProps = _this$props.InputLabelProps,
          inputProps = _this$props.inputProps,
          InputProps = _this$props.InputProps,
          inputRef = _this$props.inputRef,
          label = _this$props.label,
          multiline = _this$props.multiline,
          name = _this$props.name,
          onBlur = _this$props.onBlur,
          onChange = _this$props.onChange,
          onFocus = _this$props.onFocus,
          placeholder = _this$props.placeholder,
          required = _this$props.required,
          rows = _this$props.rows,
          rowsMax = _this$props.rowsMax,
          select = _this$props.select,
          SelectProps = _this$props.SelectProps,
          type = _this$props.type,
          value = _this$props.value,
          variant = _this$props.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["autoComplete", "autoFocus", "children", "className", "defaultValue", "error", "FormHelperTextProps", "fullWidth", "helperText", "id", "InputLabelProps", "inputProps", "InputProps", "inputRef", "label", "multiline", "name", "onBlur", "onChange", "onFocus", "placeholder", "required", "rows", "rowsMax", "select", "SelectProps", "type", "value", "variant"]);
      process.env.NODE_ENV !== "production" ? (0, _warning.default)(!select || Boolean(children), 'Material-UI: `children` must be passed when using the `TextField` component with `select`.') : void 0;
      var InputMore = {};

      if (variant === 'outlined') {
        if (InputLabelProps && typeof InputLabelProps.shrink !== 'undefined') {
          InputMore.notched = InputLabelProps.shrink;
        }

        InputMore.labelWidth = this.labelNode && this.labelNode.offsetWidth || 0;
      }

      var helperTextId = helperText && id ? "".concat(id, "-helper-text") : undefined;
      var InputComponent = variantComponent[variant];

      var InputElement = _react.default.createElement(InputComponent, (0, _extends2.default)({
        "aria-describedby": helperTextId,
        autoComplete: autoComplete,
        autoFocus: autoFocus,
        defaultValue: defaultValue,
        fullWidth: fullWidth,
        multiline: multiline,
        name: name,
        rows: rows,
        rowsMax: rowsMax,
        type: type,
        value: value,
        id: id,
        inputRef: inputRef,
        onBlur: onBlur,
        onChange: onChange,
        onFocus: onFocus,
        placeholder: placeholder,
        inputProps: inputProps
      }, InputMore, InputProps));

      return _react.default.createElement(_FormControl.default, (0, _extends2.default)({
        className: className,
        error: error,
        fullWidth: fullWidth,
        required: required,
        variant: variant
      }, other), label && _react.default.createElement(_InputLabel.default, (0, _extends2.default)({
        htmlFor: id,
        ref: this.labelRef
      }, InputLabelProps), label), select ? _react.default.createElement(_Select.default, (0, _extends2.default)({
        "aria-describedby": helperTextId,
        value: value,
        input: InputElement
      }, SelectProps), children) : InputElement, helperText && _react.default.createElement(_FormHelperText.default, (0, _extends2.default)({
        id: helperTextId
      }, FormHelperTextProps), helperText));
    }
  }]);
  return TextField;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? TextField.propTypes = {
  /**
   * This property helps users to fill forms faster, especially on mobile devices.
   * The name can be confusing, as it's more like an autofill.
   * You can learn more about it here:
   * https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
   */
  autoComplete: _propTypes.default.string,

  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: _propTypes.default.bool,

  /**
   * @ignore
   */
  children: _propTypes.default.node,

  /**
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * The default value of the `Input` element.
   */
  defaultValue: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),

  /**
   * If `true`, the input will be disabled.
   */
  disabled: _propTypes.default.bool,

  /**
   * If `true`, the label will be displayed in an error state.
   */
  error: _propTypes.default.bool,

  /**
   * Properties applied to the [`FormHelperText`](/api/form-helper-text/) element.
   */
  FormHelperTextProps: _propTypes.default.object,

  /**
   * If `true`, the input will take up the full width of its container.
   */
  fullWidth: _propTypes.default.bool,

  /**
   * The helper text content.
   */
  helperText: _propTypes.default.node,

  /**
   * The id of the `input` element.
   * Use this property to make `label` and `helperText` accessible for screen readers.
   */
  id: _propTypes.default.string,

  /**
   * Properties applied to the [`InputLabel`](/api/input-label/) element.
   */
  InputLabelProps: _propTypes.default.object,

  /**
   * Properties applied to the `Input` element.
   */
  InputProps: _propTypes.default.object,

  /**
   * Attributes applied to the native `input` element.
   */
  inputProps: _propTypes.default.object,

  /**
   * Use this property to pass a ref callback to the native input component.
   */
  inputRef: _propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object]),

  /**
   * The label content.
   */
  label: _propTypes.default.node,

  /**
   * If `dense` or `normal`, will adjust vertical spacing of this and contained components.
   */
  margin: _propTypes.default.oneOf(['none', 'dense', 'normal']),

  /**
   * If `true`, a textarea element will be rendered instead of an input.
   */
  multiline: _propTypes.default.bool,

  /**
   * Name attribute of the `input` element.
   */
  name: _propTypes.default.string,

  /**
   * @ignore
   */
  onBlur: _propTypes.default.func,

  /**
   * Callback fired when the value is changed.
   *
   * @param {object} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value`.
   */
  onChange: _propTypes.default.func,

  /**
   * @ignore
   */
  onFocus: _propTypes.default.func,

  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder: _propTypes.default.string,

  /**
   * If `true`, the label is displayed as required and the input will be required.
   */
  required: _propTypes.default.bool,

  /**
   * Number of rows to display when multiline option is set to true.
   */
  rows: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),

  /**
   * Maximum number of rows to display when multiline option is set to true.
   */
  rowsMax: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),

  /**
   * Render a `Select` element while passing the `Input` element to `Select` as `input` parameter.
   * If this option is set you must pass the options of the select as children.
   */
  select: _propTypes.default.bool,

  /**
   * Properties applied to the [`Select`](/api/select/) element.
   */
  SelectProps: _propTypes.default.object,

  /**
   * Type attribute of the `Input` element. It should be a valid HTML5 input type.
   */
  type: _propTypes.default.string,

  /**
   * The value of the `Input` element, required for a controlled component.
   */
  value: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool, _propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool]))]),

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['standard', 'outlined', 'filled'])
} : void 0;
TextField.defaultProps = {
  required: false,
  select: false,
  variant: 'standard'
};
var _default = TextField;
exports.default = _default;