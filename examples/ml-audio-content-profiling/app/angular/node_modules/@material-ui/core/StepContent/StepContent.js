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

var _warning = _interopRequireDefault(require("warning"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _Collapse = _interopRequireDefault(require("../Collapse"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      marginTop: 8,
      marginLeft: 12,
      // half icon
      paddingLeft: 8 + 12,
      // margin + half icon
      paddingRight: 8,
      borderLeft: "1px solid ".concat(theme.palette.type === 'light' ? theme.palette.grey[400] : theme.palette.grey[600])
    },

    /* Styles applied to the root element if `last={true}` (controlled by `Step`). */
    last: {
      borderLeft: 'none'
    },

    /* Styles applied to the Transition component. */
    transition: {}
  };
};

exports.styles = styles;

function StepContent(props) {
  var active = props.active,
      alternativeLabel = props.alternativeLabel,
      children = props.children,
      classes = props.classes,
      className = props.className,
      completed = props.completed,
      last = props.last,
      optional = props.optional,
      orientation = props.orientation,
      TransitionComponent = props.TransitionComponent,
      transitionDurationProp = props.transitionDuration,
      TransitionProps = props.TransitionProps,
      other = (0, _objectWithoutProperties2.default)(props, ["active", "alternativeLabel", "children", "classes", "className", "completed", "last", "optional", "orientation", "TransitionComponent", "transitionDuration", "TransitionProps"]);
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(orientation === 'vertical', 'Material-UI: <StepContent /> is only designed for use with the vertical stepper.') : void 0;
  var transitionDuration = transitionDurationProp;

  if (transitionDurationProp === 'auto' && !TransitionComponent.muiSupportAuto) {
    transitionDuration = undefined;
  }

  return _react.default.createElement("div", (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, (0, _defineProperty2.default)({}, classes.last, last), className)
  }, other), _react.default.createElement(TransitionComponent, (0, _extends2.default)({
    in: active,
    className: classes.transition,
    timeout: transitionDuration,
    unmountOnExit: true
  }, TransitionProps), children));
}

process.env.NODE_ENV !== "production" ? StepContent.propTypes = {
  /**
   * @ignore
   * Expands the content.
   */
  active: _propTypes.default.bool,

  /**
   * @ignore
   * Set internally by Step when it's supplied with the alternativeLabel property.
   */
  alternativeLabel: _propTypes.default.bool,

  /**
   * Step content.
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
   */
  completed: _propTypes.default.bool,

  /**
   * @ignore
   */
  last: _propTypes.default.bool,

  /**
   * @ignore
   * Set internally by Step when it's supplied with the optional property.
   */
  optional: _propTypes.default.bool,

  /**
   * @ignore
   */
  orientation: _propTypes.default.oneOf(['horizontal', 'vertical']),

  /**
   * The component used for the transition.
   */
  TransitionComponent: _utils.componentPropType,

  /**
   * Adjust the duration of the content expand transition.
   * Passed as a property to the transition component.
   *
   * Set to 'auto' to automatically calculate transition time based on height.
   */
  transitionDuration: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    enter: _propTypes.default.number,
    exit: _propTypes.default.number
  }), _propTypes.default.oneOf(['auto'])]),

  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: _propTypes.default.object
} : void 0;
StepContent.defaultProps = {
  TransitionComponent: _Collapse.default,
  transitionDuration: 'auto'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiStepContent'
})(StepContent);

exports.default = _default;