import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { componentPropType } from '@material-ui/utils';
import warning from 'warning';
import withStyles from '../styles/withStyles';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    justifyContent: 'center',
    height: 56,
    backgroundColor: theme.palette.background.paper
  }
});

function BottomNavigation(props) {
  const {
    children: childrenProp,
    classes,
    className: classNameProp,
    component: Component,
    onChange,
    showLabels,
    value
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["children", "classes", "className", "component", "onChange", "showLabels", "value"]);

  const className = classNames(classes.root, classNameProp);
  const children = React.Children.map(childrenProp, (child, childIndex) => {
    if (!React.isValidElement(child)) {
      return null;
    }

    process.env.NODE_ENV !== "production" ? warning(child.type !== React.Fragment, ["Material-UI: the BottomNavigation component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n')) : void 0;
    const childValue = child.props.value === undefined ? childIndex : child.props.value;
    return React.cloneElement(child, {
      selected: childValue === value,
      showLabel: child.props.showLabel !== undefined ? child.props.showLabel : showLabels,
      value: childValue,
      onChange
    });
  });
  return React.createElement(Component, _extends({
    className: className
  }, other), children);
}

process.env.NODE_ENV !== "production" ? BottomNavigation.propTypes = {
  /**
   * The content of the component.
   */
  children: PropTypes.node.isRequired,

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
   * Callback fired when the value changes.
   *
   * @param {object} event The event source of the callback
   * @param {any} value We default to the index of the child
   */
  onChange: PropTypes.func,

  /**
   * If `true`, all `BottomNavigationAction`s will show their labels.
   * By default, only the selected `BottomNavigationAction` will show its label.
   */
  showLabels: PropTypes.bool,

  /**
   * The value of the currently selected `BottomNavigationAction`.
   */
  value: PropTypes.any
} : void 0;
BottomNavigation.defaultProps = {
  component: 'div',
  showLabels: false
};
export default withStyles(styles, {
  name: 'MuiBottomNavigation'
})(BottomNavigation);