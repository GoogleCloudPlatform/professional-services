import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import Typography from '../Typography';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    margin: 0,
    padding: '24px 24px 20px',
    flex: '0 0 auto'
  }
};

function DialogTitle(props) {
  const {
    children,
    classes,
    className,
    disableTypography
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["children", "classes", "className", "disableTypography"]);

  return React.createElement("div", _extends({
    className: classNames(classes.root, className)
  }, other), disableTypography ? children : React.createElement(Typography, {
    variant: "title",
    internalDeprecatedVariant: true
  }, children));
}

process.env.NODE_ENV !== "production" ? DialogTitle.propTypes = {
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
   * If `true`, the children won't be wrapped by a typography component.
   * For instance, this can be useful to render an h4 instead of the default h2.
   */
  disableTypography: PropTypes.bool
} : void 0;
DialogTitle.defaultProps = {
  disableTypography: false
};
export default withStyles(styles, {
  name: 'MuiDialogTitle'
})(DialogTitle);