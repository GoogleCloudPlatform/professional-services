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

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Paper = _interopRequireDefault(require("../Paper"));

var _StepConnector = _interopRequireDefault(require("../StepConnector"));

// @inheritedComponent Paper
var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    padding: 24
  },

  /* Styles applied to the root element if `orientation="horizontal"`. */
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  /* Styles applied to the root element if `orientation="vertical"`. */
  vertical: {
    flexDirection: 'column'
  },

  /* Styles applied to the root element if `alternativeLabel={true}`. */
  alternativeLabel: {
    alignItems: 'flex-start'
  }
};
exports.styles = styles;

function Stepper(props) {
  var activeStep = props.activeStep,
      alternativeLabel = props.alternativeLabel,
      children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      connectorProp = props.connector,
      nonLinear = props.nonLinear,
      orientation = props.orientation,
      other = (0, _objectWithoutProperties2.default)(props, ["activeStep", "alternativeLabel", "children", "classes", "className", "connector", "nonLinear", "orientation"]);
  var className = (0, _classnames.default)(classes.root, classes[orientation], (0, _defineProperty2.default)({}, classes.alternativeLabel, alternativeLabel), classNameProp);
  var connector = _react.default.isValidElement(connectorProp) ? _react.default.cloneElement(connectorProp, {
    orientation: orientation
  }) : null;

  var childrenArray = _react.default.Children.toArray(children);

  var steps = childrenArray.map(function (step, index) {
    var controlProps = {
      alternativeLabel: alternativeLabel,
      connector: connectorProp,
      last: index + 1 === childrenArray.length,
      orientation: orientation
    };
    var state = {
      index: index,
      active: false,
      completed: false,
      disabled: false
    };

    if (activeStep === index) {
      state.active = true;
    } else if (!nonLinear && activeStep > index) {
      state.completed = true;
    } else if (!nonLinear && activeStep < index) {
      state.disabled = true;
    }

    return [!alternativeLabel && connector && index !== 0 && _react.default.cloneElement(connector, (0, _extends2.default)({
      key: index
    }, state)), _react.default.cloneElement(step, (0, _extends2.default)({}, controlProps, state, step.props))];
  });
  return _react.default.createElement(_Paper.default, (0, _extends2.default)({
    square: true,
    elevation: 0,
    className: className
  }, other), steps);
}

process.env.NODE_ENV !== "production" ? Stepper.propTypes = {
  /**
   * Set the active step (zero based index).
   */
  activeStep: _propTypes.default.number,

  /**
   * If set to 'true' and orientation is horizontal,
   * then the step label will be positioned under the icon.
   */
  alternativeLabel: _propTypes.default.bool,

  /**
   * Two or more `<Step />` components.
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
   * A component to be placed between each step.
   */
  connector: _propTypes.default.element,

  /**
   * If set the `Stepper` will not assist in controlling steps for linear flow.
   */
  nonLinear: _propTypes.default.bool,

  /**
   * The stepper orientation (layout flow direction).
   */
  orientation: _propTypes.default.oneOf(['horizontal', 'vertical'])
} : void 0;
Stepper.defaultProps = {
  activeStep: 0,
  alternativeLabel: false,
  connector: _react.default.createElement(_StepConnector.default, null),
  nonLinear: false,
  orientation: 'horizontal'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiStepper'
})(Stepper);

exports.default = _default;