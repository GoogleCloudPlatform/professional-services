import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
// @inheritedComponent ButtonBase
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import ButtonBase from '../ButtonBase';
import unsupportedProp from '../utils/unsupportedProp';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    transition: theme.transitions.create(['color', 'padding-top'], {
      duration: theme.transitions.duration.short
    }),
    padding: '6px 12px 8px',
    minWidth: 80,
    maxWidth: 168,
    color: theme.palette.text.secondary,
    flex: '1',
    '&$iconOnly': {
      paddingTop: 16
    },
    '&$selected': {
      paddingTop: 6,
      color: theme.palette.primary.main
    }
  },

  /* Styles applied to the root element if selected. */
  selected: {},

  /* Styles applied to the root element if `showLabel={false}` and not selected. */
  iconOnly: {},

  /* Styles applied to the span element that wraps the icon and label. */
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'column'
  },

  /* Styles applied to the label's span element. */
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.pxToRem(12),
    opacity: 1,
    transition: 'font-size 0.2s, opacity 0.2s',
    transitionDelay: '0.1s',
    '&$iconOnly': {
      opacity: 0,
      transitionDelay: '0s'
    },
    '&$selected': {
      fontSize: theme.typography.pxToRem(14)
    }
  }
});

class BottomNavigationAction extends React.Component {
  constructor(...args) {
    super(...args);

    this.handleChange = event => {
      const {
        onChange,
        value,
        onClick
      } = this.props;

      if (onChange) {
        onChange(event, value);
      }

      if (onClick) {
        onClick(event);
      }
    };
  }

  render() {
    const _this$props = this.props,
          {
      classes,
      className: classNameProp,
      icon,
      label,
      selected,
      showLabel: showLabelProp
    } = _this$props,
          other = _objectWithoutPropertiesLoose(_this$props, ["classes", "className", "icon", "label", "onChange", "onClick", "selected", "showLabel", "value"]);

    const className = classNames(classes.root, {
      [classes.selected]: selected,
      [classes.iconOnly]: !showLabelProp && !selected
    }, classNameProp);
    const labelClassName = classNames(classes.label, {
      [classes.selected]: selected,
      [classes.iconOnly]: !showLabelProp && !selected
    });
    return React.createElement(ButtonBase, _extends({
      className: className,
      focusRipple: true,
      onClick: this.handleChange
    }, other), React.createElement("span", {
      className: classes.wrapper
    }, icon, React.createElement("span", {
      className: labelClassName
    }, label)));
  }

}

process.env.NODE_ENV !== "production" ? BottomNavigationAction.propTypes = {
  /**
   * This property isn't supported.
   * Use the `component` property if you need to change the children structure.
   */
  children: unsupportedProp,

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
   * The icon element.
   */
  icon: PropTypes.node,

  /**
   * The label element.
   */
  label: PropTypes.node,

  /**
   * @ignore
   */
  onChange: PropTypes.func,

  /**
   * @ignore
   */
  onClick: PropTypes.func,

  /**
   * @ignore
   */
  selected: PropTypes.bool,

  /**
   * If `true`, the `BottomNavigationAction` will show its label.
   * By default, only the selected `BottomNavigationAction`
   * inside `BottomNavigation` will show its label.
   */
  showLabel: PropTypes.bool,

  /**
   * You can provide your own value. Otherwise, we fallback to the child position index.
   */
  value: PropTypes.any
} : void 0;
export default withStyles(styles, {
  name: 'MuiBottomNavigationAction'
})(BottomNavigationAction);