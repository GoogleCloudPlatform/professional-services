import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import ListContext from '../List/ListContext';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    width: 36,
    height: 36,
    fontSize: theme.typography.pxToRem(18),
    marginRight: 4
  },

  /* Styles applied to the root element when. */
  alignItemsFlexStart: {
    marginTop: 4
  },

  /* Styles applied to the children – typically the `Avatar` component. */
  icon: {
    width: 20,
    height: 20,
    fontSize: theme.typography.pxToRem(20)
  }
});
/**
 * This is a simple wrapper to apply the `dense`
 * and `align-items="flex-start"` mode styles to `Avatar`.
 */

function ListItemAvatar(props) {
  const {
    children,
    classes,
    className
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["children", "classes", "className"]);

  return React.createElement(ListContext.Consumer, null, context => React.cloneElement(children, _extends({
    className: classNames({
      [classes.root]: context.dense,
      [classes.alignItemsFlexStart]: context.alignItems === 'flex-start'
    }, className, children.props.className),
    childrenClassName: classNames({
      [classes.icon]: context.dense
    }, children.props.childrenClassName)
  }, other)));
}

process.env.NODE_ENV !== "production" ? ListItemAvatar.propTypes = {
  /**
   * The content of the component – normally `Avatar`.
   */
  children: PropTypes.element.isRequired,

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
ListItemAvatar.muiName = 'ListItemAvatar';
export default withStyles(styles, {
  name: 'MuiListItemAvatar'
})(ListItemAvatar);