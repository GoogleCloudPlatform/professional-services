"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jssGlobal = _interopRequireDefault(require("jss-global"));

var _jssNested = _interopRequireDefault(require("jss-nested"));

var _jssCamelCase = _interopRequireDefault(require("jss-camel-case"));

var _jssDefaultUnit = _interopRequireDefault(require("jss-default-unit"));

var _jssVendorPrefixer = _interopRequireDefault(require("jss-vendor-prefixer"));

var _jssPropsSort = _interopRequireDefault(require("jss-props-sort"));

// Subset of jss-preset-default with only the plugins the Material-UI components are using.
function jssPreset() {
  return {
    plugins: [(0, _jssGlobal.default)(), (0, _jssNested.default)(), (0, _jssCamelCase.default)(), (0, _jssDefaultUnit.default)(), // Disable the vendor prefixer server-side, it does nothing.
    // This way, we can get a performance boost.
    // In the documentation, we are using `autoprefixer` to solve this problem.
    typeof window === 'undefined' ? null : (0, _jssVendorPrefixer.default)(), (0, _jssPropsSort.default)()]
  };
}

var _default = jssPreset;
exports.default = _default;