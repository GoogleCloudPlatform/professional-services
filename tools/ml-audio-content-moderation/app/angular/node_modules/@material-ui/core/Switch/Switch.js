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

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _helpers = require("../utils/helpers");

var _SwitchBase = _interopRequireDefault(require("../internal/SwitchBase"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'inline-flex',
      width: 62,
      position: 'relative',
      flexShrink: 0,
      zIndex: 0,
      // Reset the stacking context.
      // For correct alignment with the text.
      verticalAlign: 'middle'
    },

    /* Styles used to create the `icon` passed to the internal `SwitchBase` component `icon` prop. */
    icon: {
      boxShadow: theme.shadows[1],
      backgroundColor: 'currentColor',
      width: 20,
      height: 20,
      borderRadius: '50%'
    },

    /* Styles applied the icon element component if `checked={true}`. */
    iconChecked: {
      boxShadow: theme.shadows[2]
    },

    /* Styles applied to the internal `SwitchBase` component's `root` class. */
    switchBase: {
      padding: 0,
      height: 48,
      width: 48,
      color: theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[400],
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest
      })
    },

    /* Styles applied to the internal `SwitchBase` component's `checked` class. */
    checked: {
      transform: 'translateX(14px)',
      '& + $bar': {
        opacity: 0.5
      }
    },

    /* Styles applied to the internal SwitchBase component's root element if `color="primary"`. */
    colorPrimary: {
      '&$checked': {
        color: theme.palette.primary.main,
        '& + $bar': {
          backgroundColor: theme.palette.primary.main
        }
      }
    },

    /* Styles applied to the internal SwitchBase component's root element if `color="secondary"`. */
    colorSecondary: {
      '&$checked': {
        color: theme.palette.secondary.main,
        '& + $bar': {
          backgroundColor: theme.palette.secondary.main
        }
      }
    },

    /* Styles applied to the internal SwitchBase component's disabled class. */
    disabled: {
      '& + $bar': {
        opacity: theme.palette.type === 'light' ? 0.12 : 0.1
      },
      '& $icon': {
        boxShadow: theme.shadows[1]
      },
      '&$switchBase': {
        color: theme.palette.type === 'light' ? theme.palette.grey[400] : theme.palette.grey[800],
        '& + $bar': {
          backgroundColor: theme.palette.type === 'light' ? theme.palette.common.black : theme.palette.common.white
        }
      }
    },

    /* Styles applied to the bar element. */
    bar: {
      borderRadius: 14 / 2,
      display: 'block',
      position: 'absolute',
      zIndex: -1,
      width: 34,
      height: 14,
      top: '50%',
      left: '50%',
      marginTop: -7,
      marginLeft: -17,
      transition: theme.transitions.create(['opacity', 'background-color'], {
        duration: theme.transitions.duration.shortest
      }),
      backgroundColor: theme.palette.type === 'light' ? theme.palette.common.black : theme.palette.common.white,
      opacity: theme.palette.type === 'light' ? 0.38 : 0.3
    }
  };
};

exports.styles = styles;

function Switch(props) {
  var classes = props.classes,
      className = props.className,
      color = props.color,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "color"]);
  return _react.default.createElement("span", {
    className: (0, _classnames.default)(classes.root, className)
  }, _react.default.createElement(_SwitchBase.default, (0, _extends2.default)({
    type: "checkbox",
    icon: _react.default.createElement("span", {
      className: classes.icon
    }),
    classes: {
      root: (0, _classnames.default)(classes.switchBase, classes["color".concat((0, _helpers.capitalize)(color))]),
      checked: classes.checked,
      disabled: classes.disabled
    },
    checkedIcon: _react.default.createElement("span", {
      className: (0, _classnames.default)(classes.icon, classes.iconChecked)
    })
  }, other)), _react.default.createElement("span", {
    className: classes.bar
  }));
}

process.env.NODE_ENV !== "production" ? Switch.propTypes = {
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
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: _propTypes.default.oneOf(['primary', 'secondary', 'default']),

  /**
   * @ignore
   */
  defaultChecked: _propTypes.default.bool,

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
   * You can pull out the new value by accessing `event.target.checked`.
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
Switch.defaultProps = {
  color: 'secondary'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiSwitch'
})(Switch);

exports.default = _default;