import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)'
  }
};
/**
 * Must be used as the last child of ListItem to function properly.
 */

function ListItemSecondaryAction(props) {
  const {
    children,
    classes,
    className
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["children", "classes", "className"]);

  return React.createElement("div", _extends({
    className: classNames(classes.root, className)
  }, other), children);
}

process.env.NODE_ENV !== "production" ? ListItemSecondaryAction.propTypes = {
  /**
   * The content of the component, normally an `IconButton` or selection control.
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
  className: PropTypes.string
} : void 0;
ListItemSecondaryAction.muiName = 'ListItemSecondaryAction';
export default withStyles(styles, {
  name: 'MuiListItemSecondaryAction'
})(ListItemSecondaryAction);