import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
import TableContext from './TableContext';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0
  }
});

class Table extends React.Component {
  constructor(...args) {
    super(...args);
    this.memoizedContextValue = {};
  }

  // To replace with the corresponding Hook once Material-UI v4 is out:
  // https://reactjs.org/docs/hooks-reference.html#usememo
  useMemo(contextValue) {
    const objectKeys = Object.keys(contextValue);

    for (let i = 0; i < objectKeys.length; i += 1) {
      const objectKey = objectKeys[i];

      if (contextValue[objectKey] !== this.memoizedContextValue[objectKey]) {
        this.memoizedContextValue = contextValue;
        break;
      }
    }

    return this.memoizedContextValue;
  }

  render() {
    const _this$props = this.props,
          {
      classes,
      className,
      component: Component,
      padding
    } = _this$props,
          other = _objectWithoutPropertiesLoose(_this$props, ["classes", "className", "component", "padding"]);

    return React.createElement(TableContext.Provider, {
      value: this.useMemo({
        padding
      })
    }, React.createElement(Component, _extends({
      className: classNames(classes.root, className)
    }, other)));
  }

}

process.env.NODE_ENV !== "production" ? Table.propTypes = {
  /**
   * The content of the table, normally `TableHead` and `TableBody`.
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
   * Allows TableCells to inherit padding of the Table.
   */
  padding: PropTypes.oneOf(['default', 'checkbox', 'dense', 'none'])
} : void 0;
Table.defaultProps = {
  component: 'table',
  padding: 'default'
};
export default withStyles(styles, {
  name: 'MuiTable'
})(Table);