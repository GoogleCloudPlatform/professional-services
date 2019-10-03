import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
import Typography from '../Typography';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: 16
  },

  /* Styles applied to the avatar element. */
  avatar: {
    flex: '0 0 auto',
    marginRight: 16
  },

  /* Styles applied to the action element. */
  action: {
    flex: '0 0 auto',
    alignSelf: 'flex-start',
    marginTop: -8,
    marginRight: -8
  },

  /* Styles applied to the content wrapper element. */
  content: {
    flex: '1 1 auto'
  },

  /* Styles applied to the title Typography element. */
  title: {},

  /* Styles applied to the subheader Typography element. */
  subheader: {}
};

function CardHeader(props) {
  const {
    action,
    avatar,
    classes,
    className: classNameProp,
    component: Component,
    disableTypography,
    subheader: subheaderProp,
    subheaderTypographyProps,
    title: titleProp,
    titleTypographyProps
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["action", "avatar", "classes", "className", "component", "disableTypography", "subheader", "subheaderTypographyProps", "title", "titleTypographyProps"]);

  let title = titleProp;

  if (title != null && title.type !== Typography && !disableTypography) {
    title = React.createElement(Typography, _extends({
      variant: avatar ? 'body2' : 'headline',
      internalDeprecatedVariant: true,
      className: classes.title,
      component: "span"
    }, titleTypographyProps), title);
  }

  let subheader = subheaderProp;

  if (subheader != null && subheader.type !== Typography && !disableTypography) {
    subheader = React.createElement(Typography, _extends({
      variant: avatar ? 'body2' : 'body1',
      className: classes.subheader,
      color: "textSecondary",
      component: "span"
    }, subheaderTypographyProps), subheader);
  }

  return React.createElement(Component, _extends({
    className: classNames(classes.root, classNameProp)
  }, other), avatar && React.createElement("div", {
    className: classes.avatar
  }, avatar), React.createElement("div", {
    className: classes.content
  }, title, subheader), action && React.createElement("div", {
    className: classes.action
  }, action));
}

process.env.NODE_ENV !== "production" ? CardHeader.propTypes = {
  /**
   * The action to display in the card header.
   */
  action: PropTypes.node,

  /**
   * The Avatar for the Card Header.
   */
  avatar: PropTypes.node,

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
   * If `true`, the children won't be wrapped by a Typography component.
   * This can be useful to render an alternative Typography variant by wrapping
   * the `title` text, and optional `subheader` text
   * with the Typography component.
   */
  disableTypography: PropTypes.bool,

  /**
   * The content of the component.
   */
  subheader: PropTypes.node,

  /**
   * These props will be forwarded to the subheader
   * (as long as disableTypography is not `true`).
   */
  subheaderTypographyProps: PropTypes.object,

  /**
   * The content of the Card Title.
   */
  title: PropTypes.node,

  /**
   * These props will be forwarded to the title
   * (as long as disableTypography is not `true`).
   */
  titleTypographyProps: PropTypes.object
} : void 0;
CardHeader.defaultProps = {
  component: 'div',
  disableTypography: false
};
export default withStyles(styles, {
  name: 'MuiCardHeader'
})(CardHeader);