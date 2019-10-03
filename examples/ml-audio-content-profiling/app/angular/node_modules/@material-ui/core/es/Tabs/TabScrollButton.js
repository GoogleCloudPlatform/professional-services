import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import KeyboardArrowLeft from '../internal/svg-icons/KeyboardArrowLeft';
import KeyboardArrowRight from '../internal/svg-icons/KeyboardArrowRight';
import withStyles from '../styles/withStyles';
import ButtonBase from '../ButtonBase';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    color: 'inherit',
    width: 56,
    flexShrink: 0
  }
};
/**
 * @ignore - internal component.
 */

var _ref = React.createElement(KeyboardArrowLeft, null);

var _ref2 = React.createElement(KeyboardArrowRight, null);

function TabScrollButton(props) {
  const {
    classes,
    className: classNameProp,
    direction,
    onClick,
    visible
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "className", "direction", "onClick", "visible"]);

  const className = classNames(classes.root, classNameProp);

  if (!visible) {
    return React.createElement("div", {
      className: className
    });
  }

  return React.createElement(ButtonBase, _extends({
    className: className,
    onClick: onClick,
    tabIndex: -1
  }, other), direction === 'left' ? _ref : _ref2);
}

process.env.NODE_ENV !== "production" ? TabScrollButton.propTypes = {
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
   * Which direction should the button indicate?
   */
  direction: PropTypes.oneOf(['left', 'right']),

  /**
   * Callback to execute for button press.
   */
  onClick: PropTypes.func,

  /**
   * Should the button be present or just consume space.
   */
  visible: PropTypes.bool
} : void 0;
TabScrollButton.defaultProps = {
  visible: true
};
export default withStyles(styles, {
  name: 'MuiPrivateTabScrollButton'
})(TabScrollButton);