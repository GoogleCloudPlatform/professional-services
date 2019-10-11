import React from 'react';
import PropTypes from 'prop-types';
import EventListener from 'react-event-listener';
import debounce from 'debounce'; // < 1kb payload overhead when lodash/debounce is > 3kb.

const styles = {
  width: 90,
  height: 90,
  position: 'absolute',
  top: -9000,
  overflow: 'scroll',
  // Support IE 11
  msOverflowStyle: 'scrollbar'
};
/**
 * @ignore - internal component.
 * The component is originates from https://github.com/STORIS/react-scrollbar-size.
 * It has been moved into the core in order to minimize the bundle size.
 */

class ScrollbarSize extends React.Component {
  constructor() {
    super();

    this.handleRef = ref => {
      this.nodeRef = ref;
    };

    this.setMeasurements = () => {
      const nodeRef = this.nodeRef;

      if (!nodeRef) {
        return;
      }

      this.scrollbarHeight = nodeRef.offsetHeight - nodeRef.clientHeight;
    };

    if (typeof window !== 'undefined') {
      this.handleResize = debounce(() => {
        const prevHeight = this.scrollbarHeight;
        this.setMeasurements();

        if (prevHeight !== this.scrollbarHeight) {
          this.props.onChange(this.scrollbarHeight);
        }
      }, 166); // Corresponds to 10 frames at 60 Hz.
    }
  }

  componentDidMount() {
    this.setMeasurements();
    this.props.onChange(this.scrollbarHeight);
  }

  componentWillUnmount() {
    this.handleResize.clear();
  }

  render() {
    return React.createElement(React.Fragment, null, React.createElement(EventListener, {
      target: "window",
      onResize: this.handleResize
    }), React.createElement("div", {
      style: styles,
      ref: this.handleRef
    }));
  }

}

process.env.NODE_ENV !== "production" ? ScrollbarSize.propTypes = {
  onChange: PropTypes.func.isRequired
} : void 0;
export default ScrollbarSize;