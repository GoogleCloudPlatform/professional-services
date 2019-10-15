import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Modal from '../Modal';
import withStyles from '../styles/withStyles';
import Slide from '../Slide';
import Paper from '../Paper';
import { capitalize } from '../utils/helpers';
import { duration } from '../styles/transitions';
const oppositeDirection = {
  left: 'right',
  right: 'left',
  top: 'down',
  bottom: 'up'
};
export function isHorizontal(props) {
  return ['left', 'right'].indexOf(props.anchor) !== -1;
}
export function getAnchor(props) {
  return props.theme.direction === 'rtl' && isHorizontal(props) ? oppositeDirection[props.anchor] : props.anchor;
}
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {},

  /* Styles applied to the root element if `variant="permanent or persistent"`. */
  docked: {
    flex: '0 0 auto'
  },

  /* Styles applied to the `Paper` component. */
  paper: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1 0 auto',
    zIndex: theme.zIndex.drawer,
    WebkitOverflowScrolling: 'touch',
    // Add iOS momentum scrolling.
    // temporary style
    position: 'fixed',
    top: 0,
    // We disable the focus ring for mouse, touch and keyboard users.
    // At some point, it would be better to keep it for keyboard users.
    // :focus-ring CSS pseudo-class will help.
    outline: 'none'
  },

  /* Styles applied to the `Paper` component if `anchor="left"`. */
  paperAnchorLeft: {
    left: 0,
    right: 'auto'
  },

  /* Styles applied to the `Paper` component if `anchor="right"`. */
  paperAnchorRight: {
    left: 'auto',
    right: 0
  },

  /* Styles applied to the `Paper` component if `anchor="top"`. */
  paperAnchorTop: {
    top: 0,
    left: 0,
    bottom: 'auto',
    right: 0,
    height: 'auto',
    maxHeight: '100%'
  },

  /* Styles applied to the `Paper` component if `anchor="bottom"`. */
  paperAnchorBottom: {
    top: 'auto',
    left: 0,
    bottom: 0,
    right: 0,
    height: 'auto',
    maxHeight: '100%'
  },

  /* Styles applied to the `Paper` component if `anchor="left"` & `variant` is not "temporary". */
  paperAnchorDockedLeft: {
    borderRight: `1px solid ${theme.palette.divider}`
  },

  /* Styles applied to the `Paper` component if `anchor="top"` & `variant` is not "temporary". */
  paperAnchorDockedTop: {
    borderBottom: `1px solid ${theme.palette.divider}`
  },

  /* Styles applied to the `Paper` component if `anchor="right"` & `variant` is not "temporary". */
  paperAnchorDockedRight: {
    borderLeft: `1px solid ${theme.palette.divider}`
  },

  /* Styles applied to the `Paper` component if `anchor="bottom"` & `variant` is not "temporary". */
  paperAnchorDockedBottom: {
    borderTop: `1px solid ${theme.palette.divider}`
  },

  /* Styles applied to the `Modal` component. */
  modal: {}
});
/**
 * The properties of the [Modal](/api/modal/) component are available
 * when `variant="temporary"` is set.
 */

class Drawer extends React.Component {
  constructor(...args) {
    super(...args);
    this.mounted = false;
  }

  componentDidMount() {
    this.mounted = true;
  }

  render() {
    const _this$props = this.props,
          {
      BackdropProps,
      children,
      classes,
      className,
      elevation,
      ModalProps: {
        BackdropProps: BackdropPropsProp
      } = {},
      onClose,
      open,
      PaperProps,
      SlideProps,
      transitionDuration,
      variant
    } = _this$props,
          ModalProps = _objectWithoutPropertiesLoose(_this$props.ModalProps, ["BackdropProps"]),
          other = _objectWithoutPropertiesLoose(_this$props, ["anchor", "BackdropProps", "children", "classes", "className", "elevation", "ModalProps", "onClose", "open", "PaperProps", "SlideProps", "theme", "transitionDuration", "variant"]);

    const anchor = getAnchor(this.props);
    const drawer = React.createElement(Paper, _extends({
      elevation: variant === 'temporary' ? elevation : 0,
      square: true,
      className: classNames(classes.paper, classes[`paperAnchor${capitalize(anchor)}`], {
        [classes[`paperAnchorDocked${capitalize(anchor)}`]]: variant !== 'temporary'
      })
    }, PaperProps), children);

    if (variant === 'permanent') {
      return React.createElement("div", _extends({
        className: classNames(classes.root, classes.docked, className)
      }, other), drawer);
    }

    const slidingDrawer = React.createElement(Slide, _extends({
      in: open,
      direction: oppositeDirection[anchor],
      timeout: transitionDuration,
      appear: this.mounted
    }, SlideProps), drawer);

    if (variant === 'persistent') {
      return React.createElement("div", _extends({
        className: classNames(classes.root, classes.docked, className)
      }, other), slidingDrawer);
    } // variant === temporary


    return React.createElement(Modal, _extends({
      BackdropProps: _extends({}, BackdropProps, BackdropPropsProp, {
        transitionDuration
      }),
      className: classNames(classes.root, classes.modal, className),
      open: open,
      onClose: onClose
    }, other, ModalProps), slidingDrawer);
  }

}

process.env.NODE_ENV !== "production" ? Drawer.propTypes = {
  /**
   * Side from which the drawer will appear.
   */
  anchor: PropTypes.oneOf(['left', 'top', 'right', 'bottom']),

  /**
   * @ignore
   */
  BackdropProps: PropTypes.object,

  /**
   * The contents of the drawer.
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
   * The elevation of the drawer.
   */
  elevation: PropTypes.number,

  /**
   * Properties applied to the [`Modal`](/api/modal/) element.
   */
  ModalProps: PropTypes.object,

  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback
   */
  onClose: PropTypes.func,

  /**
   * If `true`, the drawer is open.
   */
  open: PropTypes.bool,

  /**
   * Properties applied to the [`Paper`](/api/paper/) element.
   */
  PaperProps: PropTypes.object,

  /**
   * Properties applied to the [`Slide`](/api/slide/) element.
   */
  SlideProps: PropTypes.object,

  /**
   * @ignore
   */
  theme: PropTypes.object.isRequired,

  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    enter: PropTypes.number,
    exit: PropTypes.number
  })]),

  /**
   * The variant to use.
   */
  variant: PropTypes.oneOf(['permanent', 'persistent', 'temporary'])
} : void 0;
Drawer.defaultProps = {
  anchor: 'left',
  elevation: 16,
  open: false,
  transitionDuration: {
    enter: duration.enteringScreen,
    exit: duration.leavingScreen
  },
  variant: 'temporary' // Mobile first.

};
export default withStyles(styles, {
  name: 'MuiDrawer',
  flip: false,
  withTheme: true
})(Drawer);