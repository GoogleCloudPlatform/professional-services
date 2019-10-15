import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    marginRight: 16,
    color: theme.palette.action.active,
    flexShrink: 0,
    display: 'inline-flex'
  }
});
/**
 * A simple wrapper to apply `List` styles to an `Icon` or `SvgIcon`.
 */

function ListItemIcon(props) {
  const {
    children,
    classes,
    className: classNameProp
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["children", "classes", "className"]);

  return React.createElement("div", _extends({
    className: classNames(classes.root, classNameProp)
  }, other), children);
}

process.env.NODE_ENV !== "production" ? ListItemIcon.propTypes = {
  /**
   * The content of the component, normally `Icon`, `SvgIcon`,
   * or a `@material-ui/icons` SVG icon element.
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
export default withStyles(styles, {
  name: 'MuiListItemIcon'
})(ListItemIcon);