import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import _extends from "@babel/runtime/helpers/extends";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import warning from 'warning';
import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
export const styles = theme => {
  const elevations = {};
  theme.shadows.forEach((shadow, index) => {
    elevations[`elevation${index}`] = {
      boxShadow: shadow
    };
  });
  return _extends({
    /* Styles applied to the root element. */
    root: {
      backgroundColor: theme.palette.background.paper
    },

    /* Styles applied to the root element if `square={false}`. */
    rounded: {
      borderRadius: theme.shape.borderRadius
    }
  }, elevations);
};

function Paper(props) {
  const {
    classes,
    className: classNameProp,
    component: Component,
    square,
    elevation
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "className", "component", "square", "elevation"]);

  process.env.NODE_ENV !== "production" ? warning(elevation >= 0 && elevation < 25, `Material-UI: this elevation \`${elevation}\` is not implemented.`) : void 0;
  const className = classNames(classes.root, classes[`elevation${elevation}`], {
    [classes.rounded]: !square
  }, classNameProp);
  return React.createElement(Component, _extends({
    className: className
  }, other));
}

process.env.NODE_ENV !== "production" ? Paper.propTypes = {
  /**
   * The content of the component.
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
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: componentPropType,

  /**
   * Shadow depth, corresponds to `dp` in the spec.
   * It's accepting values between 0 and 24 inclusive.
   */
  elevation: PropTypes.number,

  /**
   * If `true`, rounded corners are disabled.
   */
  square: PropTypes.bool
} : void 0;
Paper.defaultProps = {
  component: 'div',
  elevation: 2,
  square: false
};
export default withStyles(styles, {
  name: 'MuiPaper'
})(Paper);