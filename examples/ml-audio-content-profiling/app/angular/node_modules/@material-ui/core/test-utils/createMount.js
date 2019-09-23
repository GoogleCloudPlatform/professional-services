"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMount;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _enzyme = require("enzyme");

// Generate an enhanced mount function.
function createMount() {
  var options1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options1$mount = options1.mount,
      mount = _options1$mount === void 0 ? _enzyme.mount : _options1$mount,
      other1 = (0, _objectWithoutProperties2.default)(options1, ["mount"]);
  var attachTo = window.document.createElement('div');
  attachTo.className = 'app';
  attachTo.setAttribute('id', 'app');
  window.document.body.insertBefore(attachTo, window.document.body.firstChild);

  var mountWithContext = function mountWithContext(node) {
    var options2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return mount(node, (0, _extends2.default)({
      attachTo: attachTo
    }, other1, options2));
  };

  mountWithContext.attachTo = attachTo;

  mountWithContext.cleanUp = function () {
    _reactDom.default.unmountComponentAtNode(attachTo);

    attachTo.parentNode.removeChild(attachTo);
  };

  return mountWithContext;
}