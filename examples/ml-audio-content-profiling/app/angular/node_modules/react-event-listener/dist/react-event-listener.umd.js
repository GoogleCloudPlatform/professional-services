(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('prop-types')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'prop-types'], factory) :
  (factory((global.ReactEventListener = {}),global.React,global.PropTypes));
}(this, (function (exports,React,PropTypes) { 'use strict';

  React = React && React.hasOwnProperty('default') ? React['default'] : React;
  PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

  function _typeof(obj) {
    if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
      _typeof = function _typeof(obj) {
        return _typeof2(obj);
      };
    } else {
      _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
      };
    }

    return _typeof(obj);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};
    var target = _objectWithoutPropertiesLoose(source, excluded);
    var key, i;

    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }

    return target;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var warning = function() {};

  {
    var printWarning = function printWarning(format, args) {
      var len = arguments.length;
      args = new Array(len > 2 ? len - 2 : 0);
      for (var key = 2; key < len; key++) {
        args[key - 2] = arguments[key];
      }
      var argIndex = 0;
      var message = 'Warning: ' +
        format.replace(/%s/g, function() {
          return args[argIndex++];
        });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    warning = function(condition, format, args) {
      var len = arguments.length;
      args = new Array(len > 2 ? len - 2 : 0);
      for (var key = 2; key < len; key++) {
        args[key - 2] = arguments[key];
      }
      if (format === undefined) {
        throw new Error(
            '`warning(condition, format, ...args)` requires a warning ' +
            'message argument'
        );
      }
      if (!condition) {
        printWarning.apply(null, [format].concat(args));
      }
    };
  }

  var warning_1 = warning;

  function defineProperty(object, property, attr) {
    return Object.defineProperty(object, property, attr);
  } // Passive options
  // Inspired by https://github.com/Modernizr/Modernizr/blob/master/feature-detects/dom/passiveeventlisteners.js


  var passiveOption = function () {
    var cache = null;
    return function () {
      if (cache !== null) {
        return cache;
      }

      var supportsPassiveOption = false;

      try {
        window.addEventListener('test', null, defineProperty({}, 'passive', {
          get: function get() {
            supportsPassiveOption = true;
          }
        }));
      } catch (err) {//
      }

      cache = supportsPassiveOption;
      return supportsPassiveOption;
    }();
  }();

  var defaultEventOptions = {
    capture: false,
    passive: false
  };

  function mergeDefaultEventOptions(options) {
    return _extends({}, defaultEventOptions, options);
  }

  function getEventListenerArgs(eventName, callback, options) {
    var args = [eventName, callback];
    args.push(passiveOption ? options : options.capture);
    return args;
  }

  function on(target, eventName, callback, options) {
    // eslint-disable-next-line prefer-spread
    target.addEventListener.apply(target, getEventListenerArgs(eventName, callback, options));
  }

  function off(target, eventName, callback, options) {
    // eslint-disable-next-line prefer-spread
    target.removeEventListener.apply(target, getEventListenerArgs(eventName, callback, options));
  }

  function forEachListener(props, iteratee) {
    var children = props.children,
        target = props.target,
        eventProps = _objectWithoutProperties(props, ["children", "target"]);

    Object.keys(eventProps).forEach(function (name) {
      if (name.substring(0, 2) !== 'on') {
        return;
      }

      var prop = eventProps[name];

      var type = _typeof(prop);

      var isObject = type === 'object';
      var isFunction = type === 'function';

      if (!isObject && !isFunction) {
        return;
      }

      var capture = name.substr(-7).toLowerCase() === 'capture';
      var eventName = name.substring(2).toLowerCase();
      eventName = capture ? eventName.substring(0, eventName.length - 7) : eventName;

      if (isObject) {
        iteratee(eventName, prop.handler, prop.options);
      } else {
        iteratee(eventName, prop, mergeDefaultEventOptions({
          capture: capture
        }));
      }
    });
  }

  function withOptions(handler, options) {
    warning_1(options, 'react-event-listener: should be specified options in withOptions.');
    return {
      handler: handler,
      options: mergeDefaultEventOptions(options)
    };
  }

  var EventListener =
  /*#__PURE__*/
  function (_React$PureComponent) {
    _inherits(EventListener, _React$PureComponent);

    function EventListener() {
      _classCallCheck(this, EventListener);

      return _possibleConstructorReturn(this, _getPrototypeOf(EventListener).apply(this, arguments));
    }

    _createClass(EventListener, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        this.applyListeners(on);
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        this.applyListeners(off, prevProps);
        this.applyListeners(on);
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        this.applyListeners(off);
      }
    }, {
      key: "applyListeners",
      value: function applyListeners(onOrOff) {
        var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props;
        var target = props.target;

        if (target) {
          var element = target;

          if (typeof target === 'string') {
            element = window[target];
          }

          forEachListener(props, onOrOff.bind(null, element));
        }
      }
    }, {
      key: "render",
      value: function render() {
        return this.props.children || null;
      }
    }]);

    return EventListener;
  }(React.PureComponent);

  EventListener.propTypes = {
    /**
     * You can provide a single child too.
     */
    children: PropTypes.node,

    /**
     * The DOM target to listen to.
     */
    target: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired
  };

  exports.withOptions = withOptions;
  exports.default = EventListener;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
