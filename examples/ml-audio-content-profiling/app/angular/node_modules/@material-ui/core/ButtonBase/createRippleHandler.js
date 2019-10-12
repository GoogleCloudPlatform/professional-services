"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable import/no-mutable-exports */
var createRippleHandler = function createRippleHandler(instance, eventName, action, cb) {
  return function (event) {
    if (cb) {
      cb.call(instance, event);
    }

    var ignore = false; // Ignore events that have been `event.preventDefault()` marked.

    if (event.defaultPrevented) {
      ignore = true;
    }

    if (instance.props.disableTouchRipple && eventName !== 'Blur') {
      ignore = true;
    }

    if (!ignore && instance.ripple) {
      instance.ripple[action](event);
    }

    if (typeof instance.props["on".concat(eventName)] === 'function') {
      instance.props["on".concat(eventName)](event);
    }

    return true;
  };
};
/* istanbul ignore if */


if (typeof window === 'undefined') {
  createRippleHandler = function createRippleHandler() {
    return function () {};
  };
}

var _default = createRippleHandler;
exports.default = _default;