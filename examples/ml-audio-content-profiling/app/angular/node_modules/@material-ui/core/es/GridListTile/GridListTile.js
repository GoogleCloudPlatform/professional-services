import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EventListener from 'react-event-listener';
import debounce from 'debounce'; // < 1kb payload overhead when lodash/debounce is > 3kb.

import { componentPropType } from '@material-ui/utils';
import withStyles from '../styles/withStyles';
export const styles = {
  /* Styles applied to the root element. */
  root: {
    boxSizing: 'border-box',
    flexShrink: 0
  },

  /* Styles applied to the `div` element that wraps the children. */
  tile: {
    position: 'relative',
    display: 'block',
    // In case it's not rendered with a div.
    height: '100%',
    overflow: 'hidden'
  },

  /* Styles applied to an `img` element child, if needed to ensure it covers the tile. */
  imgFullHeight: {
    height: '100%',
    transform: 'translateX(-50%)',
    position: 'relative',
    left: '50%'
  },

  /* Styles applied to an `img` element child, if needed to ensure it covers the tile. */
  imgFullWidth: {
    width: '100%',
    position: 'relative',
    transform: 'translateY(-50%)',
    top: '50%'
  }
};

class GridListTile extends React.Component {
  constructor() {
    super();

    this.fit = () => {
      const imgElement = this.imgElement;

      if (!imgElement || !imgElement.complete) {
        return;
      }

      if (imgElement.width / imgElement.height > imgElement.parentNode.offsetWidth / imgElement.parentNode.offsetHeight) {
        imgElement.classList.remove(...this.props.classes.imgFullWidth.split(' '));
        imgElement.classList.add(...this.props.classes.imgFullHeight.split(' '));
      } else {
        imgElement.classList.remove(...this.props.classes.imgFullHeight.split(' '));
        imgElement.classList.add(...this.props.classes.imgFullWidth.split(' '));
      }

      imgElement.removeEventListener('load', this.fit);
    };

    if (typeof window !== 'undefined') {
      this.handleResize = debounce(() => {
        this.fit();
      }, 166); // Corresponds to 10 frames at 60 Hz.
    }
  }

  componentDidMount() {
    this.ensureImageCover();
  }

  componentDidUpdate() {
    this.ensureImageCover();
  }

  componentWillUnmount() {
    this.handleResize.clear();
  }

  ensureImageCover() {
    if (!this.imgElement) {
      return;
    }

    if (this.imgElement.complete) {
      this.fit();
    } else {
      this.imgElement.addEventListener('load', this.fit);
    }
  }

  render() {
    const _this$props = this.props,
          {
      children,
      classes,
      className,
      component: Component
    } = _this$props,
          other = _objectWithoutPropertiesLoose(_this$props, ["children", "classes", "className", "cols", "component", "rows"]);

    return React.createElement(Component, _extends({
      className: classNames(classes.root, className)
    }, other), React.createElement(EventListener, {
      target: "window",
      onResize: this.handleResize
    }), React.createElement("div", {
      className: classes.tile
    }, React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return null;
      }

      if (child.type === 'img') {
        return React.cloneElement(child, {
          ref: node => {
            this.imgElement = node;
          }
        });
      }

      return child;
    })));
  }

}

process.env.NODE_ENV !== "production" ? GridListTile.propTypes = {
  /**
   * Theoretically you can pass any node as children, but the main use case is to pass an img,
   * in which case GridListTile takes care of making the image "cover" available space
   * (similar to `background-size: cover` or to `object-fit: cover`).
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
   * Width of the tile in number of grid cells.
   */
  cols: PropTypes.number,

  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: componentPropType,

  /**
   * Height of the tile in number of grid cells.
   */
  rows: PropTypes.number
} : void 0;
GridListTile.defaultProps = {
  cols: 1,
  component: 'li',
  rows: 1
};
export default withStyles(styles, {
  name: 'MuiGridListTile'
})(GridListTile);