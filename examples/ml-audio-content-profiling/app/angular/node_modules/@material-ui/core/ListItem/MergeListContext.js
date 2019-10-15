"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ListContext = _interopRequireDefault(require("../List/ListContext"));

/**
 * @ignore - internal component.
 *
 * Consumes a context and passes that context merged with its props.
 */
function MergeListContext(props) {
  var alignItems = props.alignItems,
      children = props.children,
      dense = props.dense;
  return _react.default.createElement(_ListContext.default.Consumer, null, function (context) {
    var childContext = {
      dense: dense || context.dense || false,
      alignItems: alignItems
    };
    return _react.default.createElement(_ListContext.default.Provider, {
      value: childContext
    }, children(childContext));
  });
}

process.env.NODE_ENV !== "production" ? MergeListContext.propTypes = {
  alignItems: _propTypes.default.oneOf(['flex-start', 'center']).isRequired,
  children: _propTypes.default.func.isRequired,
  dense: _propTypes.default.bool.isRequired
} : void 0;
var _default = MergeListContext;
exports.default = _default;