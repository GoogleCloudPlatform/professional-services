"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Paper = _interopRequireDefault(require("../Paper"));

var _helpers = require("../utils/helpers");

var _LinearProgress = _interopRequireDefault(require("../LinearProgress"));

// @inheritedComponent Paper
var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: theme.palette.background.default,
      padding: 8
    },

    /* Styles applied to the root element if `position="bottom"`. */
    positionBottom: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: theme.zIndex.mobileStepper
    },

    /* Styles applied to the root element if `position="top"`. */
    positionTop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: theme.zIndex.mobileStepper
    },

    /* Styles applied to the root element if `position="static"`. */
    positionStatic: {},

    /* Styles applied to the dots container if `variant="dots"`. */
    dots: {
      display: 'flex',
      flexDirection: 'row'
    },

    /* Styles applied to each dot if `variant="dots"`. */
    dot: {
      backgroundColor: theme.palette.action.disabled,
      borderRadius: '50%',
      width: 8,
      height: 8,
      margin: '0 2px'
    },

    /* Styles applied to a dot if `variant="dots"` and this is the active step. */
    dotActive: {
      backgroundColor: theme.palette.primary.main
    },

    /* Styles applied to the Linear Progress component if `variant="progress"`. */
    progress: {
      width: '50%'
    }
  };
};

exports.styles = styles;

function MobileStepper(props) {
  var activeStep = props.activeStep,
      backButton = props.backButton,
      classes = props.classes,
      classNameProp = props.className,
      LinearProgressProps = props.LinearProgressProps,
      nextButton = props.nextButton,
      position = props.position,
      steps = props.steps,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["activeStep", "backButton", "classes", "className", "LinearProgressProps", "nextButton", "position", "steps", "variant"]);
  var className = (0, _classnames.default)(classes.root, classes["position".concat((0, _helpers.capitalize)(position))], classNameProp);
  return _react.default.createElement(_Paper.default, (0, _extends2.default)({
    square: true,
    elevation: 0,
    className: className
  }, other), backButton, variant === 'dots' && _react.default.createElement("div", {
    className: classes.dots
  }, (0, _toConsumableArray2.default)(new Array(steps)).map(function (_, step) {
    var dotClassName = (0, _classnames.default)(classes.dot, (0, _defineProperty2.default)({}, classes.dotActive, step === activeStep)); // eslint-disable-next-line react/no-array-index-key

    return _react.default.createElement("div", {
      key: step,
      className: dotClassName
    });
  })), variant === 'progress' && _react.default.createElement(_LinearProgress.default, (0, _extends2.default)({
    className: classes.progress,
    variant: "determinate",
    value: Math.ceil(activeStep / (steps - 1) * 100)
  }, LinearProgressProps)), nextButton);
}

process.env.NODE_ENV !== "production" ? MobileStepper.propTypes = {
  /**
   * Set the active step (zero based index).
   * Defines which dot is highlighted when the variant is 'dots'.
   */
  activeStep: _propTypes.default.number,

  /**
   * A back button element. For instance, it can be a `Button` or an `IconButton`.
   */
  backButton: _propTypes.default.node,

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
   * Properties applied to the `LinearProgress` element.
   */
  LinearProgressProps: _propTypes.default.object,

  /**
   * A next button element. For instance, it can be a `Button` or an `IconButton`.
   */
  nextButton: _propTypes.default.node,

  /**
   * Set the positioning type.
   */
  position: _propTypes.default.oneOf(['bottom', 'top', 'static']),

  /**
   * The total steps.
   */
  steps: _propTypes.default.number.isRequired,

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['text', 'dots', 'progress'])
} : void 0;
MobileStepper.defaultProps = {
  activeStep: 0,
  position: 'bottom',
  variant: 'dots'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiMobileStepper'
})(MobileStepper);

exports.default = _default;