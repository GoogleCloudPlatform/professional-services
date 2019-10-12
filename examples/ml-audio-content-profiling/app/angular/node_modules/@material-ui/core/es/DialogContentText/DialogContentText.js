import _extends from "@babel/runtime/helpers/extends";
// @inheritedComponent Typography
import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '../styles/withStyles';
import Typography from '../Typography';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    // Should use variant="body1" in v4
    lineHeight: 1.5
  }
};

function DialogContentText(props) {
  return React.createElement(Typography, _extends({
    component: "p",
    internalDeprecatedVariant: true,
    variant: "subheading",
    color: "textSecondary"
  }, props));
}

process.env.NODE_ENV !== "production" ? DialogContentText.propTypes = {
  /**
   * The content of the component.
   */
  children: PropTypes.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired
} : void 0;
export default withStyles(styles, {
  name: 'MuiDialogContentText'
})(DialogContentText);