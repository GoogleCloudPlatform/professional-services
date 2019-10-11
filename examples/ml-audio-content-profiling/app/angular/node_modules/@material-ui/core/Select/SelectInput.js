"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _warning = _interopRequireDefault(require("warning"));

var _utils = require("@material-ui/utils");

var _Menu = _interopRequireDefault(require("../Menu/Menu"));

var _utils2 = require("../InputBase/utils");

var _reactHelpers = require("../utils/reactHelpers");

function areEqualValues(a, b) {
  if ((0, _typeof2.default)(b) === 'object' && b !== null) {
    return a === b;
  }

  return String(a) === String(b);
}
/**
 * @ignore - internal component.
 */


var SelectInput =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(SelectInput, _React$Component);

  function SelectInput(props) {
    var _this;

    (0, _classCallCheck2.default)(this, SelectInput);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(SelectInput).call(this));
    _this.ignoreNextBlur = false;

    _this.update = function (_ref) {
      var event = _ref.event,
          open = _ref.open;

      if (_this.isOpenControlled) {
        if (open) {
          _this.props.onOpen(event);
        } else {
          _this.props.onClose(event);
        }

        return;
      }

      _this.setState({
        // Perform the layout computation outside of the render method.
        menuMinWidth: _this.props.autoWidth ? null : _this.displayRef.clientWidth,
        open: open
      });
    };

    _this.handleClick = function (event) {
      // Opening the menu is going to blur the. It will be focused back when closed.
      _this.ignoreNextBlur = true;

      _this.update({
        open: true,
        event: event
      });
    };

    _this.handleClose = function (event) {
      _this.update({
        open: false,
        event: event
      });
    };

    _this.handleItemClick = function (child) {
      return function (event) {
        if (!_this.props.multiple) {
          _this.update({
            open: false,
            event: event
          });
        }

        var _this$props = _this.props,
            onChange = _this$props.onChange,
            name = _this$props.name;

        if (onChange) {
          var value;

          if (_this.props.multiple) {
            value = Array.isArray(_this.props.value) ? (0, _toConsumableArray2.default)(_this.props.value) : [];
            var itemIndex = value.indexOf(child.props.value);

            if (itemIndex === -1) {
              value.push(child.props.value);
            } else {
              value.splice(itemIndex, 1);
            }
          } else {
            value = child.props.value;
          }

          event.persist();
          event.target = {
            value: value,
            name: name
          };
          onChange(event, child);
        }
      };
    };

    _this.handleBlur = function (event) {
      if (_this.ignoreNextBlur === true) {
        // The parent components are relying on the bubbling of the event.
        event.stopPropagation();
        _this.ignoreNextBlur = false;
        return;
      }

      if (_this.props.onBlur) {
        var _this$props2 = _this.props,
            value = _this$props2.value,
            name = _this$props2.name;
        event.persist();
        event.target = {
          value: value,
          name: name
        };

        _this.props.onBlur(event);
      }
    };

    _this.handleKeyDown = function (event) {
      if (_this.props.readOnly) {
        return;
      }

      if ([' ', 'ArrowUp', 'ArrowDown', // The native select doesn't respond to enter on MacOS, but it's recommended by
      // https://www.w3.org/TR/wai-aria-practices/examples/listbox/listbox-collapsible.html
      'Enter'].indexOf(event.key) !== -1) {
        event.preventDefault(); // Opening the menu is going to blur the. It will be focused back when closed.

        _this.ignoreNextBlur = true;

        _this.update({
          open: true,
          event: event
        });
      }
    };

    _this.handleDisplayRef = function (ref) {
      _this.displayRef = ref;
    };

    _this.handleInputRef = function (ref) {
      var inputRef = _this.props.inputRef;

      if (!inputRef) {
        return;
      }

      var nodeProxy = {
        node: ref,
        // By pass the native input as we expose a rich object (array).
        value: _this.props.value,
        focus: function focus() {
          _this.displayRef.focus();
        }
      };
      (0, _reactHelpers.setRef)(inputRef, nodeProxy);
    };

    _this.isOpenControlled = props.open !== undefined;
    _this.state = {
      menuMinWidth: null,
      open: false
    };
    return _this;
  }

  (0, _createClass2.default)(SelectInput, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.isOpenControlled && this.props.open) {
        // Focus the display node so the focus is restored on this element once
        // the menu is closed.
        this.displayRef.focus(); // Rerender with the resolve `displayRef` reference.

        this.forceUpdate();
      }

      if (this.props.autoFocus) {
        this.displayRef.focus();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this,
          _classNames;

      var _this$props3 = this.props,
          autoWidth = _this$props3.autoWidth,
          children = _this$props3.children,
          classes = _this$props3.classes,
          className = _this$props3.className,
          disabled = _this$props3.disabled,
          displayEmpty = _this$props3.displayEmpty,
          IconComponent = _this$props3.IconComponent,
          inputRef = _this$props3.inputRef,
          _this$props3$MenuProp = _this$props3.MenuProps,
          MenuProps = _this$props3$MenuProp === void 0 ? {} : _this$props3$MenuProp,
          multiple = _this$props3.multiple,
          name = _this$props3.name,
          onBlur = _this$props3.onBlur,
          onChange = _this$props3.onChange,
          onClose = _this$props3.onClose,
          onFocus = _this$props3.onFocus,
          onOpen = _this$props3.onOpen,
          openProp = _this$props3.open,
          readOnly = _this$props3.readOnly,
          renderValue = _this$props3.renderValue,
          required = _this$props3.required,
          SelectDisplayProps = _this$props3.SelectDisplayProps,
          tabIndexProp = _this$props3.tabIndex,
          _this$props3$type = _this$props3.type,
          type = _this$props3$type === void 0 ? 'hidden' : _this$props3$type,
          value = _this$props3.value,
          variant = _this$props3.variant,
          other = (0, _objectWithoutProperties2.default)(_this$props3, ["autoWidth", "children", "classes", "className", "disabled", "displayEmpty", "IconComponent", "inputRef", "MenuProps", "multiple", "name", "onBlur", "onChange", "onClose", "onFocus", "onOpen", "open", "readOnly", "renderValue", "required", "SelectDisplayProps", "tabIndex", "type", "value", "variant"]);
      var open = this.isOpenControlled && this.displayRef ? openProp : this.state.open;
      delete other['aria-invalid'];
      var display;
      var displaySingle = '';
      var displayMultiple = [];
      var computeDisplay = false; // No need to display any value if the field is empty.

      if ((0, _utils2.isFilled)(this.props) || displayEmpty) {
        if (renderValue) {
          display = renderValue(value);
        } else {
          computeDisplay = true;
        }
      }

      var items = _react.default.Children.map(children, function (child) {
        if (!_react.default.isValidElement(child)) {
          return null;
        }

        process.env.NODE_ENV !== "production" ? (0, _warning.default)(child.type !== _react.default.Fragment, ["Material-UI: the Select component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n')) : void 0;
        var selected;

        if (multiple) {
          if (!Array.isArray(value)) {
            throw new Error('Material-UI: the `value` property must be an array ' + 'when using the `Select` component with `multiple`.');
          }

          selected = value.some(function (v) {
            return areEqualValues(v, child.props.value);
          });

          if (selected && computeDisplay) {
            displayMultiple.push(child.props.children);
          }
        } else {
          selected = areEqualValues(value, child.props.value);

          if (selected && computeDisplay) {
            displaySingle = child.props.children;
          }
        }

        return _react.default.cloneElement(child, {
          onClick: _this2.handleItemClick(child),
          role: 'option',
          selected: selected,
          value: undefined,
          // The value is most likely not a valid HTML attribute.
          'data-value': child.props.value // Instead, we provide it as a data attribute.

        });
      });

      if (computeDisplay) {
        display = multiple ? displayMultiple.join(', ') : displaySingle;
      } // Avoid performing a layout computation in the render method.


      var menuMinWidth = this.state.menuMinWidth;

      if (!autoWidth && this.isOpenControlled && this.displayRef) {
        menuMinWidth = this.displayRef.clientWidth;
      }

      var tabIndex;

      if (typeof tabIndexProp !== 'undefined') {
        tabIndex = tabIndexProp;
      } else {
        tabIndex = disabled ? null : 0;
      }

      return _react.default.createElement("div", {
        className: classes.root
      }, _react.default.createElement("div", (0, _extends2.default)({
        className: (0, _classnames.default)(classes.select, classes.selectMenu, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.disabled, disabled), (0, _defineProperty2.default)(_classNames, classes.filled, variant === 'filled'), (0, _defineProperty2.default)(_classNames, classes.outlined, variant === 'outlined'), _classNames), className),
        ref: this.handleDisplayRef,
        "aria-pressed": open ? 'true' : 'false',
        tabIndex: tabIndex,
        role: "button",
        "aria-owns": open ? "menu-".concat(name || '') : undefined,
        "aria-haspopup": "true",
        onKeyDown: this.handleKeyDown,
        onBlur: this.handleBlur,
        onClick: disabled || readOnly ? null : this.handleClick,
        onFocus: onFocus // The id can help with end-to-end testing automation.
        ,
        id: name ? "select-".concat(name) : undefined
      }, SelectDisplayProps), display || _react.default.createElement("span", {
        dangerouslySetInnerHTML: {
          __html: '&#8203;'
        }
      })), _react.default.createElement("input", (0, _extends2.default)({
        value: Array.isArray(value) ? value.join(',') : value,
        name: name,
        ref: this.handleInputRef,
        type: type
      }, other)), _react.default.createElement(IconComponent, {
        className: classes.icon
      }), _react.default.createElement(_Menu.default, (0, _extends2.default)({
        id: "menu-".concat(name || ''),
        anchorEl: this.displayRef,
        open: open,
        onClose: this.handleClose
      }, MenuProps, {
        MenuListProps: (0, _extends2.default)({
          role: 'listbox',
          disableListWrap: true
        }, MenuProps.MenuListProps),
        PaperProps: (0, _extends2.default)({}, MenuProps.PaperProps, {
          style: (0, _extends2.default)({
            minWidth: menuMinWidth
          }, MenuProps.PaperProps != null ? MenuProps.PaperProps.style : null)
        })
      }), items));
    }
  }]);
  return SelectInput;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? SelectInput.propTypes = {
  /**
   * @ignore
   */
  autoFocus: _propTypes.default.bool,

  /**
   * If true, the width of the popover will automatically be set according to the items inside the
   * menu, otherwise it will be at least the width of the select input.
   */
  autoWidth: _propTypes.default.bool,

  /**
   * The option elements to populate the select with.
   * Can be some `<MenuItem>` elements.
   */
  children: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * The CSS class name of the select element.
   */
  className: _propTypes.default.string,

  /**
   * If `true`, the select will be disabled.
   */
  disabled: _propTypes.default.bool,

  /**
   * If `true`, the selected item is displayed even if its value is empty.
   */
  displayEmpty: _propTypes.default.bool,

  /**
   * The icon that displays the arrow.
   */
  IconComponent: _utils.componentPropType,

  /**
   * Use that property to pass a ref callback to the native select element.
   */
  inputRef: _propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object]),

  /**
   * Properties applied to the [`Menu`](/api/menu/) element.
   */
  MenuProps: _propTypes.default.object,

  /**
   * If true, `value` must be an array and the menu will support multiple selections.
   */
  multiple: _propTypes.default.bool,

  /**
   * Name attribute of the `select` or hidden `input` element.
   */
  name: _propTypes.default.string,

  /**
   * @ignore
   */
  onBlur: _propTypes.default.func,

  /**
   * Callback function fired when a menu item is selected.
   *
   * @param {object} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value`.
   * @param {object} [child] The react element that was selected.
   */
  onChange: _propTypes.default.func,

  /**
   * Callback fired when the component requests to be closed.
   * Use in controlled mode (see open).
   *
   * @param {object} event The event source of the callback
   */
  onClose: _propTypes.default.func,

  /**
   * @ignore
   */
  onFocus: _propTypes.default.func,

  /**
   * Callback fired when the component requests to be opened.
   * Use in controlled mode (see open).
   *
   * @param {object} event The event source of the callback
   */
  onOpen: _propTypes.default.func,

  /**
   * Control `select` open state.
   */
  open: _propTypes.default.bool,

  /**
   * @ignore
   */
  readOnly: _propTypes.default.bool,

  /**
   * Render the selected value.
   *
   * @param {*} value The `value` provided to the component.
   * @returns {ReactElement}
   */
  renderValue: _propTypes.default.func,

  /**
   * @ignore
   */
  required: _propTypes.default.bool,

  /**
   * Properties applied to the clickable div element.
   */
  SelectDisplayProps: _propTypes.default.object,

  /**
   * @ignore
   */
  tabIndex: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.string]),

  /**
   * @ignore
   */
  type: _propTypes.default.string,

  /**
   * The input value.
   */
  value: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool, _propTypes.default.object, _propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number, _propTypes.default.bool, _propTypes.default.object]))]).isRequired,

  /**
   * The variant to use.
   */
  variant: _propTypes.default.oneOf(['standard', 'outlined', 'filled'])
} : void 0;
var _default = SelectInput;
exports.default = _default;