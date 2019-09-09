"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _warning = _interopRequireDefault(require("warning"));

var _ownerDocument = _interopRequireDefault(require("../utils/ownerDocument"));

var _List = _interopRequireDefault(require("../List"));

// @inheritedComponent List
var MenuList =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(MenuList, _React$Component);

  function MenuList() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, MenuList);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(MenuList)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.state = {
      currentTabIndex: null
    };

    _this.handleBlur = function (event) {
      _this.blurTimer = setTimeout(function () {
        if (_this.listRef) {
          var list = _this.listRef;
          var currentFocus = (0, _ownerDocument.default)(list).activeElement;

          if (!list.contains(currentFocus)) {
            _this.resetTabIndex();
          }
        }
      }, 30);

      if (_this.props.onBlur) {
        _this.props.onBlur(event);
      }
    };

    _this.handleKeyDown = function (event) {
      var list = _this.listRef;
      var key = event.key;
      var currentFocus = (0, _ownerDocument.default)(list).activeElement;

      if ((key === 'ArrowUp' || key === 'ArrowDown') && (!currentFocus || currentFocus && !list.contains(currentFocus))) {
        if (_this.selectedItemRef) {
          _this.selectedItemRef.focus();
        } else {
          list.firstChild.focus();
        }
      } else if (key === 'ArrowDown') {
        event.preventDefault();

        if (currentFocus.nextElementSibling) {
          currentFocus.nextElementSibling.focus();
        } else if (!_this.props.disableListWrap) {
          list.firstChild.focus();
        }
      } else if (key === 'ArrowUp') {
        event.preventDefault();

        if (currentFocus.previousElementSibling) {
          currentFocus.previousElementSibling.focus();
        } else if (!_this.props.disableListWrap) {
          list.lastChild.focus();
        }
      } else if (key === 'Home') {
        event.preventDefault();
        list.firstChild.focus();
      } else if (key === 'End') {
        event.preventDefault();
        list.lastChild.focus();
      }

      if (_this.props.onKeyDown) {
        _this.props.onKeyDown(event);
      }
    };

    _this.handleItemFocus = function (event) {
      var list = _this.listRef;

      if (list) {
        for (var i = 0; i < list.children.length; i += 1) {
          if (list.children[i] === event.currentTarget) {
            _this.setTabIndex(i);

            break;
          }
        }
      }
    };

    return _this;
  }

  (0, _createClass2.default)(MenuList, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.resetTabIndex();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      clearTimeout(this.blurTimer);
    }
  }, {
    key: "setTabIndex",
    value: function setTabIndex(index) {
      this.setState({
        currentTabIndex: index
      });
    }
  }, {
    key: "focus",
    value: function focus() {
      var currentTabIndex = this.state.currentTabIndex;
      var list = this.listRef;

      if (!list || !list.children || !list.firstChild) {
        return;
      }

      if (currentTabIndex && currentTabIndex >= 0) {
        list.children[currentTabIndex].focus();
      } else {
        list.firstChild.focus();
      }
    }
  }, {
    key: "resetTabIndex",
    value: function resetTabIndex() {
      var list = this.listRef;
      var currentFocus = (0, _ownerDocument.default)(list).activeElement;
      var items = [];

      for (var i = 0; i < list.children.length; i += 1) {
        items.push(list.children[i]);
      }

      var currentFocusIndex = items.indexOf(currentFocus);

      if (currentFocusIndex !== -1) {
        return this.setTabIndex(currentFocusIndex);
      }

      if (this.selectedItemRef) {
        return this.setTabIndex(items.indexOf(this.selectedItemRef));
      }

      return this.setTabIndex(0);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          children = _this$props.children,
          className = _this$props.className,
          onBlur = _this$props.onBlur,
          onKeyDown = _this$props.onKeyDown,
          disableListWrap = _this$props.disableListWrap,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["children", "className", "onBlur", "onKeyDown", "disableListWrap"]);
      return _react.default.createElement(_List.default, (0, _extends2.default)({
        role: "menu",
        ref: function ref(_ref) {
          _this2.listRef = _reactDom.default.findDOMNode(_ref);
        },
        className: className,
        onKeyDown: this.handleKeyDown,
        onBlur: this.handleBlur
      }, other), _react.default.Children.map(children, function (child, index) {
        if (!_react.default.isValidElement(child)) {
          return null;
        }

        process.env.NODE_ENV !== "production" ? (0, _warning.default)(child.type !== _react.default.Fragment, ["Material-UI: the MenuList component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n')) : void 0;
        return _react.default.cloneElement(child, {
          tabIndex: index === _this2.state.currentTabIndex ? 0 : -1,
          ref: child.props.selected ? function (ref) {
            _this2.selectedItemRef = _reactDom.default.findDOMNode(ref);
          } : undefined,
          onFocus: _this2.handleItemFocus
        });
      }));
    }
  }]);
  return MenuList;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? MenuList.propTypes = {
  /**
   * MenuList contents, normally `MenuItem`s.
   */
  children: _propTypes.default.node,

  /**
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * If `true`, the menu items will not wrap focus.
   */
  disableListWrap: _propTypes.default.bool,

  /**
   * @ignore
   */
  onBlur: _propTypes.default.func,

  /**
   * @ignore
   */
  onKeyDown: _propTypes.default.func
} : void 0;
MenuList.defaultProps = {
  disableListWrap: false
};
var _default = MenuList;
exports.default = _default;