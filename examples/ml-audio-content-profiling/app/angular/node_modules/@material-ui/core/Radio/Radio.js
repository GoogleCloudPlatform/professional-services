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

var _classnames = _interopRequireDefault(require("classnames"));

var _SwitchBase = _interopRequireDefault(require("../internal/SwitchBase"));

var _RadioButtonUnchecked = _interopRequireDefault(require("../internal/svg-icons/RadioButtonUnchecked"));

var _RadioButtonChecked = _interopRequireDefault(require("../internal/svg-icons/RadioButtonChecked"));

var _helpers = require("../utils/helpers");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      color: theme.palette.text.secondary
    },

    /* Styles applied to the root element if `checked={true}`. */
    checked: {},

    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},

    /* Styles applied to the root element if `color="primary"`. */
    colorPrimary: {
      '&$checked': {
        color: theme.palette.primary.main
      },
      '&$disabled': {
        color: theme.palette.action.disabled
      }
    },

    /* Styles applied to the root element if `color="secondary"`. */
    colorSecondary: {
      '&$checked': {
        color: theme.palette.secondary.main
      },
      '&$disabled': {
        color: theme.palette.action.disabled
      }
    }
  };
};

exports.styles = styles;

var _ref = _react.default.createElement(_RadioButtonUnchecked.default, null);

var _ref2 = _react.default.createElement(_RadioButtonChecked.default, null);

function Radio(props) {
  var classes = props.classes,
      color = props.color,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "color"]);
  return _react.default.createElement(_SwitchBase.default, (0, _extends2.default)({
    type: "radio",
    icon: _ref,
    checkedIcon: _ref2,
    classes: {
      root: (0, _classnames.default)(classes.root, classes["color".concat((0, _helpers.capitalize)(color))]),
      checked: classes.checked,
      disabled: classes.disabled
    }
  }, other));
}

process.env.NODE_ENV !== "production" ? Radio.propTypes = {
  /**
   * If `true`, the component is checked.
   */
  checked: _propTypes.default.oneOfType([_propTypes.default.bool, _propTypes.default.string]),

  /**
   * The icon to display when the component is checked.
   */
  checkedIcon: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: _propTypes.default.oneOf(['primary', 'secondary', 'default']),

  /**
   * If `true`, the switch will be disabled.
   */
  disabled: _propTypes.default.bool,

  /**
   * If `true`, the ripple effect will be disabled.
   */
  disableRipple: _propTypes.default.bool,

  /**
   * The icon to display when the component is unchecked.
   */
  icon: _propTypes.default.node,

  /**
   * The id of the `input` element.
   */
  id: _propTypes.default.string,

  /**
   * Attributes applied to the `input` element.
   */
  inputProps: _propTypes.default.object,

  /**
   * Use that property to pass a ref callback to the native input component.
   */
  inputRef: _propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object]),

  /**
   * Callback fired when the state is changed.
   *
   * @param {object} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value`.
   * @param {boolean} checked The `checked` value of the switch
   */
  onChange: _propTypes.default.func,

  /**
   * The input component property `type`.
   */
  type: _propTypes.default.string,

  /**
   * The value of the component.
   */
  value: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool])
} : void 0;
Radio.defaultProps = {
  color: 'secondary'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiRadio'
})(Radio);

exports.default = _default;