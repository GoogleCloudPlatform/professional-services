"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _utils = require("@material-ui/utils");

var _NativeSelectInput = _interopRequireDefault(require("./NativeSelectInput"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _formControlState = _interopRequireDefault(require("../FormControl/formControlState"));

var _withFormControlContext = _interopRequireDefault(require("../FormControl/withFormControlContext"));

var _ArrowDropDown = _interopRequireDefault(require("../internal/svg-icons/ArrowDropDown"));

var _Input = _interopRequireDefault(require("../Input"));

// @inheritedComponent Input
var styles = function styles(theme) {
  return {
    /* Styles applied to the `Input` component `root` class. */
    root: {
      position: 'relative',
      width: '100%'
    },

    /* Styles applied to the `Input` component `select` class. */
    select: {
      '-moz-appearance': 'none',
      // Reset
      '-webkit-appearance': 'none',
      // Reset
      // When interacting quickly, the text can end up selected.
      // Native select can't be selected either.
      userSelect: 'none',
      paddingRight: 32,
      borderRadius: 0,
      // Reset
      height: '1.1875em',
      // Reset (19px), match the native input line-height
      width: 'calc(100% - 32px)',
      minWidth: 16,
      // So it doesn't collapse.
      cursor: 'pointer',
      '&:focus': {
        // Show that it's not an text input
        backgroundColor: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 0 // Reset Chrome style

      },
      // Remove IE 11 arrow
      '&::-ms-expand': {
        display: 'none'
      },
      '&$disabled': {
        cursor: 'default'
      },
      '&[multiple]': {
        height: 'auto'
      },
      '&:not([multiple]) option, &:not([multiple]) optgroup': {
        backgroundColor: theme.palette.background.paper
      }
    },

    /* Styles applied to the `Input` component if `variant="filled"`. */
    filled: {
      width: 'calc(100% - 44px)'
    },

    /* Styles applied to the `Input` component if `variant="outlined"`. */
    outlined: {
      width: 'calc(100% - 46px)',
      borderRadius: theme.shape.borderRadius
    },

    /* Styles applied to the `Input` component `selectMenu` class. */
    selectMenu: {
      width: 'auto',
      // Fix Safari textOverflow
      height: 'auto',
      // Reset
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      minHeight: '1.1875em' // Reset (19px), match the native input line-height

    },

    /* Styles applied to the `Input` component `disabled` class. */
    disabled: {},

    /* Styles applied to the `Input` component `icon` class. */
    icon: {
      // We use a position absolute over a flexbox in order to forward the pointer events
      // to the input.
      position: 'absolute',
      right: 0,
      top: 'calc(50% - 12px)',
      // Center vertically
      color: theme.palette.action.active,
      'pointer-events': 'none' // Don't block pointer events on the select under the icon.

    }
  };
};
/**
 * An alternative to `<Select native />` with a much smaller bundle size footprint.
 */


exports.styles = styles;

function NativeSelect(props) {
  var children = props.children,
      classes = props.classes,
      IconComponent = props.IconComponent,
      input = props.input,
      inputProps = props.inputProps,
      muiFormControl = props.muiFormControl,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "IconComponent", "input", "inputProps", "muiFormControl", "variant"]);
  var fcs = (0, _formControlState.default)({
    props: props,
    muiFormControl: muiFormControl,
    states: ['variant']
  });
  return _react.default.cloneElement(input, (0, _extends2.default)({
    // Most of the logic is implemented in `NativeSelectInput`.
    // The `Select` component is a simple API wrapper to expose something better to play with.
    inputComponent: _NativeSelectInput.default,
    inputProps: (0, _extends2.default)({
      children: children,
      classes: classes,
      IconComponent: IconComponent,
      variant: fcs.variant,
      type: undefined
    }, inputProps, input ? input.props.inputProps : {})
  }, other));
}

process.env.NODE_ENV !== "production" ? NativeSelect.propTypes = {
  /**
   * The option elements to populate the select with.
   * Can be some `<option>` elements.
   */
  children: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * The icon that displays the arrow.
   */
  IconComponent: _utils.componentPropType,

  /**
   * An `Input` element; does not have to be a material-ui specific `Input`.
   */
  input: _propTypes.default.element,

  /**
   * Attributes applied to the `select` element.
   */
  inputProps: _propTypes.default.object,

  /**
   * @ignore
   */
  muiFormControl: _propTypes.default.object,

  /**
   * Callback function fired when a menu item is selected.
   *
   * @param {object} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value`.
   */
  onChange: _propTypes.default.func,

  /**
   * The input value.
   */
  value: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool, _propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool]))]),

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['standard', 'outlined', 'filled'])
} : void 0;
NativeSelect.defaultProps = {
  IconComponent: _ArrowDropDown.default,
  input: _react.default.createElement(_Input.default, null)
};
NativeSelect.muiName = 'Select';

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiNativeSelect'
})((0, _withFormControlContext.default)(NativeSelect));

exports.default = _default;