"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _helpers = require("../utils/helpers");

var RADIUS = 10;

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      position: 'relative',
      display: 'inline-flex',
      // For correct alignment with the text.
      verticalAlign: 'middle'
    },

    /* Styles applied to the badge `span` element. */
    badge: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      right: 0,
      boxSizing: 'border-box',
      fontFamily: theme.typography.fontFamily,
      fontWeight: theme.typography.fontWeightMedium,
      fontSize: theme.typography.pxToRem(12),
      minWidth: RADIUS * 2,
      padding: '0 4px',
      height: RADIUS * 2,
      borderRadius: RADIUS,
      backgroundColor: theme.palette.color,
      color: theme.palette.textColor,
      zIndex: 1,
      // Render the badge on top of potential ripples.
      transform: 'scale(1) translate(50%, -50%)',
      transformOrigin: '100% 0%',
      transition: theme.transitions.create('transform', {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.enteringScreen
      })
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

    /* Styles applied to the root element if `color="error"`. */
    colorError: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText
    },

    /* Styles applied to the badge `span` element if `invisible={true}`. */
    invisible: {
      transition: theme.transitions.create('transform', {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.leavingScreen
      }),
      transform: 'scale(0) translate(50%, -50%)',
      transformOrigin: '100% 0%'
    },

    /* Styles applied to the root element if `variant="dot"`. */
    dot: {
      height: 6,
      minWidth: 6,
      padding: 0
    }
  };
};

exports.styles = styles;

function Badge(props) {
  var _classNames;

  var badgeContent = props.badgeContent,
      children = props.children,
      classes = props.classes,
      className = props.className,
      color = props.color,
      ComponentProp = props.component,
      invisibleProp = props.invisible,
      showZero = props.showZero,
      max = props.max,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["badgeContent", "children", "classes", "className", "color", "component", "invisible", "showZero", "max", "variant"]);
  var invisible = invisibleProp;

  if (invisibleProp == null && Number(badgeContent) === 0 && !showZero) {
    invisible = true;
  }

  var badgeClassName = (0, _classnames.default)(classes.badge, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes["color".concat((0, _helpers.capitalize)(color))], color !== 'default'), (0, _defineProperty2.default)(_classNames, classes.invisible, invisible), (0, _defineProperty2.default)(_classNames, classes.dot, variant === 'dot'), _classNames));
  var displayValue = '';

  if (variant !== 'dot') {
    displayValue = badgeContent > max ? "".concat(max, "+") : badgeContent;
  }

  return _react.default.createElement(ComponentProp, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className)
  }, other), children, _react.default.createElement("span", {
    className: badgeClassName
  }, displayValue));
}

process.env.NODE_ENV !== "production" ? Badge.propTypes = {
  /**
   * The content rendered within the badge.
   */
  badgeContent: _propTypes.default.node,

  /**
   * The badge will be added relative to this node.
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
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: _propTypes.default.oneOf(['default', 'primary', 'secondary', 'error']),

  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * If `true`, the badge will be invisible.
   */
  invisible: _propTypes.default.bool,

  /**
   * Max count to show.
   */
  max: _propTypes.default.number,

  /**
   * Controls whether the badge is hidden when `badgeContent` is zero.
   */
  showZero: _propTypes.default.bool,

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['standard', 'dot'])
} : void 0;
Badge.defaultProps = {
  color: 'default',
  component: 'span',
  max: 99,
  showZero: false,
  variant: 'standard'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiBadge'
})(Badge);

exports.default = _default;