"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findOutermostIntrinsic;

/**
 * like ReactWrapper#getDOMNode() but returns a ReactWrapper
 *
 * @param {import('enzyme').ReactWrapper} reactWrapper
 * @returns {import('enzyme').ReactWrapper} the wrapper for the outermost DOM node
 */
function findOutermostIntrinsic(reactWrapper) {
  return reactWrapper.findWhere(function (n) {
    return n.exists() && typeof n.type() === 'string';
  }).first();
}