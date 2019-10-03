import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
import Tablelvl2Context from '../Table/Tablelvl2Context';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'table-header-group'
  }
};
const contextValue = {
  variant: 'head'
};

function TableHead(props) {
  const {
    classes,
    className,
    component: Component
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "className", "component"]);

  return React.createElement(Tablelvl2Context.Provider, {
    value: contextValue
  }, React.createElement(Component, _extends({
    className: classNames(classes.root, className)
  }, other)));
}

process.env.NODE_ENV !== "production" ? TableHead.propTypes = {
  /**
   * The content of the component, normally `TableRow`.
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
  component: componentPropType
} : void 0;
TableHead.defaultProps = {
  component: 'thead'
};
export default withStyles(styles, {
  name: 'MuiTableHead'
})(TableHead);