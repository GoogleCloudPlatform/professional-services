"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _TableContext = _interopRequireDefault(require("./TableContext"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'table',
      fontFamily: theme.typography.fontFamily,
      width: '100%',
      borderCollapse: 'collapse',
      borderSpacing: 0
    }
  };
};

exports.styles = styles;

var Table =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(Table, _React$Component);

  function Table() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Table);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Table)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _this.memoizedContextValue = {};
    return _this;
  }

  (0, _createClass2.default)(Table, [{
    key: "useMemo",
    // To replace with the corresponding Hook once Material-UI v4 is out:
    // https://reactjs.org/docs/hooks-reference.html#usememo
    value: function useMemo(contextValue) {
      var objectKeys = Object.keys(contextValue);

      for (var i = 0; i < objectKeys.length; i += 1) {
        var objectKey = objectKeys[i];

        if (contextValue[objectKey] !== this.memoizedContextValue[objectKey]) {
          this.memoizedContextValue = contextValue;
          break;
        }
      }

      return this.memoizedContextValue;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          classes = _this$props.classes,
          className = _this$props.className,
          Component = _this$props.component,
          padding = _this$props.padding,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["classes", "className", "component", "padding"]);
      return _react.default.createElement(_TableContext.default.Provider, {
        value: this.useMemo({
          padding: padding
        })
      }, _react.default.createElement(Component, (0, _extends2.default)({
        className: (0, _classnames.default)(classes.root, className)
      }, other)));
    }
  }]);
  return Table;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? Table.propTypes = {
  /**
   * The content of the table, normally `TableHead` and `TableBody`.
   */
  children: _propTypes.default.node.isRequired,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * Allows TableCells to inherit padding of the Table.
   */
  padding: _propTypes.default.oneOf(['default', 'checkbox', 'dense', 'none'])
} : void 0;
Table.defaultProps = {
  component: 'table',
  padding: 'default'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiTable'
})(Table);

exports.default = _default;