import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
// @inheritedComponent Paper
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import Paper from '../Paper';
import Typography from '../Typography';
import { emphasize } from '../styles/colorManipulator';
export const styles = theme => {
  const emphasis = theme.palette.type === 'light' ? 0.8 : 0.98;
  const backgroundColor = emphasize(theme.palette.background.default, emphasis);
  return {
    /* Styles applied to the root element. */
    root: {
      color: theme.palette.getContrastText(backgroundColor),
      backgroundColor,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '6px 24px',
      [theme.breakpoints.up('md')]: {
        minWidth: 288,
        maxWidth: 568,
        borderRadius: theme.shape.borderRadius
      },
      [theme.breakpoints.down('sm')]: {
        flexGrow: 1
      }
    },

    /* Styles applied to the message wrapper element. */
    message: {
      padding: '8px 0'
    },

    /* Styles applied to the action wrapper element if `action` is provided. */
    action: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingLeft: 24,
      marginRight: -8
    }
  };
};

function SnackbarContent(props) {
  const {
    action,
    classes,
    className,
    message
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["action", "classes", "className", "message"]);

  return React.createElement(Paper, _extends({
    component: Typography,
    headlineMapping: {
      body1: 'div',
      body2: 'div'
    },
    role: "alertdialog",
    square: true,
    elevation: 6,
    className: classNames(classes.root, className)
  }, other), React.createElement("div", {
    className: classes.message
  }, message), action ? React.createElement("div", {
    className: classes.action
  }, action) : null);
}

process.env.NODE_ENV !== "production" ? SnackbarContent.propTypes = {
  /**
   * The action to display.
   */
  action: PropTypes.node,

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
   * The message to display.
   */
  message: PropTypes.node
} : void 0;
export default withStyles(styles, {
  name: 'MuiSnackbarContent'
})(SnackbarContent);