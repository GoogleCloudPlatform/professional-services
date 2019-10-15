import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';
/**
 * @ignore - internal component.
 */

class Ripple extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      visible: false,
      leaving: false
    };

    this.handleEnter = () => {
      this.setState({
        visible: true
      });
    };

    this.handleExit = () => {
      this.setState({
        leaving: true
      });
    };
  }

  render() {
    const _this$props = this.props,
          {
      classes,
      className: classNameProp,
      pulsate,
      rippleX,
      rippleY,
      rippleSize
    } = _this$props,
          other = _objectWithoutPropertiesLoose(_this$props, ["classes", "className", "pulsate", "rippleX", "rippleY", "rippleSize"]);

    const {
      visible,
      leaving
    } = this.state;
    const rippleClassName = classNames(classes.ripple, {
      [classes.rippleVisible]: visible,
      [classes.ripplePulsate]: pulsate
    }, classNameProp);
    const rippleStyles = {
      width: rippleSize,
      height: rippleSize,
      top: -(rippleSize / 2) + rippleY,
      left: -(rippleSize / 2) + rippleX
    };
    const childClassName = classNames(classes.child, {
      [classes.childLeaving]: leaving,
      [classes.childPulsate]: pulsate
    });
    return React.createElement(Transition, _extends({
      onEnter: this.handleEnter,
      onExit: this.handleExit
    }, other), React.createElement("span", {
      className: rippleClassName,
      style: rippleStyles
    }, React.createElement("span", {
      className: childClassName
    })));
  }

}

process.env.NODE_ENV !== "production" ? Ripple.propTypes = {
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
   * If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
   */
  pulsate: PropTypes.bool,

  /**
   * Diameter of the ripple.
   */
  rippleSize: PropTypes.number,

  /**
   * Horizontal position of the ripple center.
   */
  rippleX: PropTypes.number,

  /**
   * Vertical position of the ripple center.
   */
  rippleY: PropTypes.number
} : void 0;
Ripple.defaultProps = {
  pulsate: false
};
export default Ripple;