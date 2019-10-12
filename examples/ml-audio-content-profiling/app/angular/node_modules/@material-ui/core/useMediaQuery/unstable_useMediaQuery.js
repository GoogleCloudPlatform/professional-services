"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testReset = testReset;
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

/* eslint-disable camelcase */
// This variable will be true once the server-side hydration is completed.
var hydrationCompleted = false;

function useMounted() {
  var mountedRef = _react.default.useRef(false);

  _react.default.useEffect(function () {
    mountedRef.current = true;
    return function () {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef.current;
}

function unstable_useMediaQuery(queryInput) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var query = queryInput.replace('@media ', '');
  var _options$defaultMatch = options.defaultMatches,
      defaultMatchesInput = _options$defaultMatch === void 0 ? false : _options$defaultMatch,
      _options$noSsr = options.noSsr,
      noSsr = _options$noSsr === void 0 ? false : _options$noSsr,
      _options$ssrMatchMedi = options.ssrMatchMedia,
      ssrMatchMedia = _options$ssrMatchMedi === void 0 ? null : _options$ssrMatchMedi;
  var defaultMatches = defaultMatchesInput;
  var mounted = useMounted();

  if (mounted) {// Once the component is mounted, we rely on the
    // event listeners to return the correct matches value.
  } else if (hydrationCompleted || noSsr) {
    defaultMatches = window.matchMedia(query).matches;
  } else if (ssrMatchMedia) {
    defaultMatches = ssrMatchMedia(query).matches;
  } // Early exit for server-side rendering performance.

  /* istanbul ignore if */


  if (typeof window === 'undefined') {
    return defaultMatches;
  }

  var _React$useState = _react.default.useState(defaultMatches),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      matches = _React$useState2[0],
      setMatches = _React$useState2[1];

  _react.default.useEffect(function () {
    hydrationCompleted = true;
    var queryList = window.matchMedia(query);

    if (matches !== queryList.matches) {
      setMatches(queryList.matches);
    }

    function handleMatchesChange(event) {
      setMatches(event.matches);
    }

    queryList.addListener(handleMatchesChange);
    return function () {
      queryList.removeListener(handleMatchesChange);
    };
  }, [query]);

  return matches;
}

function testReset() {
  hydrationCompleted = false;
}

var _default = unstable_useMediaQuery;
exports.default = _default;