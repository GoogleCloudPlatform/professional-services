"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.alignSelf = exports.flexShrink = exports.flexGrow = exports.flex = exports.order = exports.alignContent = exports.alignItems = exports.justifyContent = exports.flexWrap = exports.flexDirection = void 0;

var _style = _interopRequireDefault(require("./style"));

var _compose = _interopRequireDefault(require("./compose"));

var flexDirection = (0, _style.default)({
  prop: 'flexDirection'
});
exports.flexDirection = flexDirection;
var flexWrap = (0, _style.default)({
  prop: 'flexWrap'
});
exports.flexWrap = flexWrap;
var justifyContent = (0, _style.default)({
  prop: 'justifyContent'
});
exports.justifyContent = justifyContent;
var alignItems = (0, _style.default)({
  prop: 'alignItems'
});
exports.alignItems = alignItems;
var alignContent = (0, _style.default)({
  prop: 'alignContent'
});
exports.alignContent = alignContent;
var order = (0, _style.default)({
  prop: 'order'
});
exports.order = order;
var flex = (0, _style.default)({
  prop: 'flex'
});
exports.flex = flex;
var flexGrow = (0, _style.default)({
  prop: 'flexGrow'
});
exports.flexGrow = flexGrow;
var flexShrink = (0, _style.default)({
  prop: 'flexShrink'
});
exports.flexShrink = flexShrink;
var alignSelf = (0, _style.default)({
  prop: 'alignSelf'
});
exports.alignSelf = alignSelf;
var flexbox = (0, _compose.default)(flexDirection, flexWrap, justifyContent, alignItems, alignContent, order, flex, flexGrow, flexShrink, alignSelf);
var _default = flexbox;
exports.default = _default;