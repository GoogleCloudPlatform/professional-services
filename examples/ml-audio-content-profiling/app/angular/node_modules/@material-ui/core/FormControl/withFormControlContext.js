"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withFormControlContext;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireDefault(require("react"));

var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));

var _FormControlContext = _interopRequireDefault(require("./FormControlContext"));

var _utils = require("@material-ui/utils");

function withFormControlContext(Component) {
  var EnhancedComponent = function EnhancedComponent(props) {
    return _react.default.createElement(_FormControlContext.default.Consumer, null, function (context) {
      return _react.default.createElement(Component, (0, _extends2.default)({
        muiFormControl: context
      }, props));
    });
  };

  if (process.env.NODE_ENV !== 'production') {
    EnhancedComponent.displayName = "WithFormControlContext(".concat((0, _utils.getDisplayName)(Component), ")");
  }

  (0, _hoistNonReactStatics.default)(EnhancedComponent, Component);
  return EnhancedComponent;
}