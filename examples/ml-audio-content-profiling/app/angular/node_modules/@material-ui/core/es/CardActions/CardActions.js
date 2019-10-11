import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import { cloneChildrenWithClassName } from '../utils/reactHelpers';
import '../Button'; // So we don't have any override priority issue.

export const styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: '8px 4px'
  },

  /* Styles applied to the root element if `disableActionSpacing={true}`. */
  disableActionSpacing: {
    padding: 8
  },

  /* Styles applied to the children. */
  action: {
    margin: '0 4px'
  }
};

function CardActions(props) {
  const {
    disableActionSpacing,
    children,
    classes,
    className
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["disableActionSpacing", "children", "classes", "className"]);

  return React.createElement("div", _extends({
    className: classNames(classes.root, {
      [classes.disableActionSpacing]: disableActionSpacing
    }, className)
  }, other), disableActionSpacing ? children : cloneChildrenWithClassName(children, classes.action));
}

process.env.NODE_ENV !== "production" ? CardActions.propTypes = {
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
   * If `true`, the card actions do not have additional margin.
   */
  disableActionSpacing: PropTypes.bool
} : void 0;
CardActions.defaultProps = {
  disableActionSpacing: false
};
export default withStyles(styles, {
  name: 'MuiCardActions'
})(CardActions);