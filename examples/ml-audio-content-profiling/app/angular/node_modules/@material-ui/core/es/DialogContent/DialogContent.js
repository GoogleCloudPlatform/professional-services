import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    // Add iOS momentum scrolling.
    padding: '0 24px 24px',
    '&:first-child': {
      paddingTop: 24
    }
  }
};

function DialogContent(props) {
  const {
    classes,
    children,
    className
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "children", "className"]);

  return React.createElement("div", _extends({
    className: classNames(classes.root, className)
  }, other), children);
}

process.env.NODE_ENV !== "production" ? DialogContent.propTypes = {
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
  className: PropTypes.string
} : void 0;
export default withStyles(styles, {
  name: 'MuiDialogContent'
})(DialogContent);