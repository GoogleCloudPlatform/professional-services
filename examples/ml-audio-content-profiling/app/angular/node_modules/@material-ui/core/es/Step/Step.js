import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import warning from 'warning';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {},

  /* Styles applied to the root element if `orientation="horizontal"`. */
  horizontal: {
    paddingLeft: 8,
    paddingRight: 8,
    '&:first-child': {
      paddingLeft: 0
    },
    '&:last-child': {
      paddingRight: 0
    }
  },

  /* Styles applied to the root element if `orientation="vertical"`. */
  vertical: {},

  /* Styles applied to the root element if `alternativeLabel={true}`. */
  alternativeLabel: {
    flex: 1,
    position: 'relative'
  },

  /* Styles applied to the root element if `completed={true}`. */
  completed: {}
};

function Step(props) {
  const {
    active,
    alternativeLabel,
    children,
    classes,
    className: classNameProp,
    completed,
    connector,
    disabled,
    index,
    last,
    orientation
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["active", "alternativeLabel", "children", "classes", "className", "completed", "connector", "disabled", "index", "last", "orientation"]);

  const className = classNames(classes.root, classes[orientation], {
    [classes.alternativeLabel]: alternativeLabel,
    [classes.completed]: completed
  }, classNameProp);
  return React.createElement("div", _extends({
    className: className
  }, other), connector && alternativeLabel && index !== 0 && React.cloneElement(connector, {
    orientation,
    alternativeLabel,
    index,
    active,
    completed,
    disabled
  }), React.Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return null;
    }

    process.env.NODE_ENV !== "production" ? warning(child.type !== React.Fragment, ["Material-UI: the Step component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n')) : void 0;
    return React.cloneElement(child, _extends({
      active,
      alternativeLabel,
      completed,
      disabled,
      last,
      icon: index + 1,
      orientation
    }, child.props));
  }));
}

process.env.NODE_ENV !== "production" ? Step.propTypes = {
  /**
   * Sets the step as active. Is passed to child components.
   */
  active: PropTypes.bool,

  /**
   * @ignore
   * Set internally by Stepper when it's supplied with the alternativeLabel property.
   */
  alternativeLabel: PropTypes.bool,

  /**
   * Should be `Step` sub-components such as `StepLabel`, `StepContent`.
   */
  children: PropTypes.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,

  /**
   * @ignore
   */
  className: PropTypes.string,

  /**
   * Mark the step as completed. Is passed to child components.
   */
  completed: PropTypes.bool,

  /**
   * @ignore
   * Passed down from Stepper if alternativeLabel is also set.
   */
  connector: PropTypes.element,

  /**
   * Mark the step as disabled, will also disable the button if
   * `StepButton` is a child of `Step`. Is passed to child components.
   */
  disabled: PropTypes.bool,

  /**
   * @ignore
   * Used internally for numbering.
   */
  index: PropTypes.number,

  /**
   * @ignore
   */
  last: PropTypes.bool,

  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical'])
} : void 0;
Step.defaultProps = {
  active: false,
  completed: false,
  disabled: false
};
export default withStyles(styles, {
  name: 'MuiStep'
})(Step);