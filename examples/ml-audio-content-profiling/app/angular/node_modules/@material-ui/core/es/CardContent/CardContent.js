import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    padding: 16,
    '&:last-child': {
      paddingBottom: 24
    }
  }
};

function CardContent(props) {
  const {
    classes,
    className,
    component: Component
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "className", "component"]);

  return React.createElement(Component, _extends({
    className: classNames(classes.root, className)
  }, other));
}

process.env.NODE_ENV !== "production" ? CardContent.propTypes = {
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
  component: componentPropType
} : void 0;
CardContent.defaultProps = {
  component: 'div'
};
export default withStyles(styles, {
  name: 'MuiCardContent'
})(CardContent);