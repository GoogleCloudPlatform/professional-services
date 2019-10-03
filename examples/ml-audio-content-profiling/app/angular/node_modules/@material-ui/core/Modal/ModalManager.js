"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _style = _interopRequireDefault(require("dom-helpers/style"));

var _scrollbarSize = _interopRequireDefault(require("dom-helpers/util/scrollbarSize"));

var _ownerDocument = _interopRequireDefault(require("../utils/ownerDocument"));

var _isOverflowing = _interopRequireDefault(require("./isOverflowing"));

var _manageAriaHidden = require("./manageAriaHidden");

function findIndexOf(data, callback) {
  var idx = -1;
  data.some(function (item, index) {
    if (callback(item)) {
      idx = index;
      return true;
    }

    return false;
  });
  return idx;
}

function getPaddingRight(node) {
  return parseInt((0, _style.default)(node, 'paddingRight') || 0, 10);
}

function setContainerStyle(data) {
  // We are only interested in the actual `style` here because we will override it.
  data.style = {
    overflow: data.container.style.overflow,
    paddingRight: data.container.style.paddingRight
  };
  var style = {
    overflow: 'hidden'
  };

  if (data.overflowing) {
    var scrollbarSize = (0, _scrollbarSize.default)(); // Use computed style, here to get the real padding to add our scrollbar width.

    style.paddingRight = "".concat(getPaddingRight(data.container) + scrollbarSize, "px"); // .mui-fixed is a global helper.

    var fixedNodes = (0, _ownerDocument.default)(data.container).querySelectorAll('.mui-fixed');

    for (var i = 0; i < fixedNodes.length; i += 1) {
      var paddingRight = getPaddingRight(fixedNodes[i]);
      data.prevPaddings.push(paddingRight);
      fixedNodes[i].style.paddingRight = "".concat(paddingRight + scrollbarSize, "px");
    }
  }

  Object.keys(style).forEach(function (key) {
    data.container.style[key] = style[key];
  });
}

function removeContainerStyle(data) {
  // The modal might be closed before it had the chance to be mounted in the DOM.
  if (data.style) {
    Object.keys(data.style).forEach(function (key) {
      data.container.style[key] = data.style[key];
    });
  }

  var fixedNodes = (0, _ownerDocument.default)(data.container).querySelectorAll('.mui-fixed');

  for (var i = 0; i < fixedNodes.length; i += 1) {
    fixedNodes[i].style.paddingRight = "".concat(data.prevPaddings[i], "px");
  }
}
/**
 * @ignore - do not document.
 *
 * Proper state management for containers and the modals in those containers.
 * Simplified, but inspired by react-overlay's ModalManager class.
 * Used by the Modal to ensure proper styling of containers.
 */


var ModalManager =
/*#__PURE__*/
function () {
  function ModalManager() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, ModalManager);
    var _options$hideSiblingN = options.hideSiblingNodes,
        hideSiblingNodes = _options$hideSiblingN === void 0 ? true : _options$hideSiblingN,
        _options$handleContai = options.handleContainerOverflow,
        handleContainerOverflow = _options$handleContai === void 0 ? true : _options$handleContai;
    this.hideSiblingNodes = hideSiblingNodes;
    this.handleContainerOverflow = handleContainerOverflow; // this.modals[modalIdx] = modal

    this.modals = []; // this.data[containerIdx] = {
    //   modals: [],
    //   container,
    //   overflowing,
    //   prevPaddings,
    // }

    this.data = [];
  }

  (0, _createClass2.default)(ModalManager, [{
    key: "add",
    value: function add(modal, container) {
      var modalIdx = this.modals.indexOf(modal);

      if (modalIdx !== -1) {
        return modalIdx;
      }

      modalIdx = this.modals.length;
      this.modals.push(modal); // If the modal we are adding is already in the DOM.

      if (modal.modalRef) {
        (0, _manageAriaHidden.ariaHidden)(modal.modalRef, false);
      }

      if (this.hideSiblingNodes) {
        (0, _manageAriaHidden.ariaHiddenSiblings)(container, modal.mountNode, modal.modalRef, true);
      }

      var containerIdx = findIndexOf(this.data, function (item) {
        return item.container === container;
      });

      if (containerIdx !== -1) {
        this.data[containerIdx].modals.push(modal);
        return modalIdx;
      }

      var data = {
        modals: [modal],
        container: container,
        overflowing: (0, _isOverflowing.default)(container),
        prevPaddings: []
      };
      this.data.push(data);
      return modalIdx;
    }
  }, {
    key: "mount",
    value: function mount(modal) {
      var containerIdx = findIndexOf(this.data, function (item) {
        return item.modals.indexOf(modal) !== -1;
      });
      var data = this.data[containerIdx];

      if (!data.style && this.handleContainerOverflow) {
        setContainerStyle(data);
      }
    }
  }, {
    key: "remove",
    value: function remove(modal) {
      var modalIdx = this.modals.indexOf(modal);

      if (modalIdx === -1) {
        return modalIdx;
      }

      var containerIdx = findIndexOf(this.data, function (item) {
        return item.modals.indexOf(modal) !== -1;
      });
      var data = this.data[containerIdx];
      data.modals.splice(data.modals.indexOf(modal), 1);
      this.modals.splice(modalIdx, 1); // If that was the last modal in a container, clean up the container.

      if (data.modals.length === 0) {
        if (this.handleContainerOverflow) {
          removeContainerStyle(data);
        } // In case the modal wasn't in the DOM yet.


        if (modal.modalRef) {
          (0, _manageAriaHidden.ariaHidden)(modal.modalRef, true);
        }

        if (this.hideSiblingNodes) {
          (0, _manageAriaHidden.ariaHiddenSiblings)(data.container, modal.mountNode, modal.modalRef, false);
        }

        this.data.splice(containerIdx, 1);
      } else if (this.hideSiblingNodes) {
        // Otherwise make sure the next top modal is visible to a screen reader.
        var nextTop = data.modals[data.modals.length - 1]; // as soon as a modal is adding its modalRef is undefined. it can't set
        // aria-hidden because the dom element doesn't exist either
        // when modal was unmounted before modalRef gets null

        if (nextTop.modalRef) {
          (0, _manageAriaHidden.ariaHidden)(nextTop.modalRef, false);
        }
      }

      return modalIdx;
    }
  }, {
    key: "isTopModal",
    value: function isTopModal(modal) {
      return !!this.modals.length && this.modals[this.modals.length - 1] === modal;
    }
  }]);
  return ModalManager;
}();

var _default = ModalManager;
exports.default = _default;