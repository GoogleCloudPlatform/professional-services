import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
// @inheritedComponent Paper
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Paper from '../Paper';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    overflow: 'hidden'
  }
};

function Card(props) {
  const {
    classes,
    className,
    raised
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["classes", "className", "raised"]);

  return React.createElement(Paper, _extends({
    className: classNames(classes.root, className),
    elevation: raised ? 8 : 1
  }, other));
}

process.env.NODE_ENV !== "production" ? Card.propTypes = {
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
   * If `true`, the card will use raised styling.
   */
  raised: PropTypes.bool
} : void 0;
Card.defaultProps = {
  raised: false
};
export default withStyles(styles, {
  name: 'MuiCard'
})(Card);