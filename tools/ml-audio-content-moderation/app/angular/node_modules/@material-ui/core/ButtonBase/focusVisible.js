"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.detectFocusVisible = detectFocusVisible;
exports.listenForFocusKeys = listenForFocusKeys;

var _warning = _interopRequireDefault(require("warning"));

var _ownerDocument = _interopRequireDefault(require("../utils/ownerDocument"));

var internal = {
  focusKeyPressed: false,
  keyUpEventTimeout: -1
};

function findActiveElement(doc) {
  var activeElement = doc.activeElement;

  while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
}

function detectFocusVisible(instance, element, callback) {
  var attempt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(instance.focusVisibleCheckTime, 'Material-UI: missing instance.focusVisibleCheckTime.') : void 0;
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(instance.focusVisibleMaxCheckTimes, 'Material-UI: missing instance.focusVisibleMaxCheckTimes.') : void 0;
  instance.focusVisibleTimeout = setTimeout(function () {
    var doc = (0, _ownerDocument.default)(element);
    var activeElement = findActiveElement(doc);

    if (internal.focusKeyPressed && (activeElement === element || element.contains(activeElement))) {
      callback();
    } else if (attempt < instance.focusVisibleMaxCheckTimes) {
      detectFocusVisible(instance, element, callback, attempt + 1);
    }
  }, instance.focusVisibleCheckTime);
}

var FOCUS_KEYS = [9, // 'Tab',
13, // 'Enter',
27, // 'Escape',
32, // ' ',
37, // 'ArrowLeft',
38, // 'ArrowUp',
39, // 'ArrowRight',
40];

function isFocusKey(event) {
  // Use event.keyCode to support IE 11
  return FOCUS_KEYS.indexOf(event.keyCode) > -1;
}

var handleKeyUpEvent = function handleKeyUpEvent(event) {
  if (isFocusKey(event)) {
    internal.focusKeyPressed = true; // Let's consider that the user is using a keyboard during a window frame of 500ms.

    clearTimeout(internal.keyUpEventTimeout);
    internal.keyUpEventTimeout = setTimeout(function () {
      internal.focusKeyPressed = false;
    }, 500);
  }
};

function listenForFocusKeys(win) {
  // The event listener will only be added once per window.
  // Duplicate event listeners will be ignored by addEventListener.
  // Also, this logic is client side only, we don't need a teardown.
  win.addEventListener('keyup', handleKeyUpEvent);
}