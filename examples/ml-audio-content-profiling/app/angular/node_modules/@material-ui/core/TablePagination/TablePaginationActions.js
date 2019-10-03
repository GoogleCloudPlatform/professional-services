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

var _KeyboardArrowLeft = _interopRequireDefault(require("../internal/svg-icons/KeyboardArrowLeft"));

var _KeyboardArrowRight = _interopRequireDefault(require("../internal/svg-icons/KeyboardArrowRight"));

var _withTheme = _interopRequireDefault(require("../styles/withTheme"));

var _IconButton = _interopRequireDefault(require("../IconButton"));

var _ref = _react.default.createElement(_KeyboardArrowRight.default, null);

var _ref2 = _react.default.createElement(_KeyboardArrowLeft.default, null);

var _ref3 = _react.default.createElement(_KeyboardArrowLeft.default, null);

var _ref4 = _react.default.createElement(_KeyboardArrowRight.default, null);

/**
 * @ignore - internal component.
 */
var TablePaginationActions =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(TablePaginationActions, _React$Component);

  function TablePaginationActions() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, TablePaginationActions);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(TablePaginationActions)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.handleBackButtonClick = function (event) {
      _this.props.onChangePage(event, _this.props.page - 1);
    };

    _this.handleNextButtonClick = function (event) {
      _this.props.onChangePage(event, _this.props.page + 1);
    };

    return _this;
  }

  (0, _createClass2.default)(TablePaginationActions, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          backIconButtonProps = _this$props.backIconButtonProps,
          count = _this$props.count,
          nextIconButtonProps = _this$props.nextIconButtonProps,
          onChangePage = _this$props.onChangePage,
          page = _this$props.page,
          rowsPerPage = _this$props.rowsPerPage,
          theme = _this$props.theme,
          other = (0, _objectWithoutProperties2.default)(_this$props, ["backIconButtonProps", "count", "nextIconButtonProps", "onChangePage", "page", "rowsPerPage", "theme"]);
      return _react.default.createElement("div", other, _react.default.createElement(_IconButton.default, (0, _extends2.default)({
        onClick: this.handleBackButtonClick,
        disabled: page === 0,
        color: "inherit"
      }, backIconButtonProps), theme.direction === 'rtl' ? _ref : _ref2), _react.default.createElement(_IconButton.default, (0, _extends2.default)({
        onClick: this.handleNextButtonClick,
        disabled: page >= Math.ceil(count / rowsPerPage) - 1,
        color: "inherit"
      }, nextIconButtonProps), theme.direction === 'rtl' ? _ref3 : _ref4));
    }
  }]);
  return TablePaginationActions;
}(_react.default.Component);

process.env.NODE_ENV !== "production" ? TablePaginationActions.propTypes = {
  /**
   * Properties applied to the back arrow [`IconButton`](/api/icon-button/) element.
   */
  backIconButtonProps: _propTypes.default.object,

  /**
   * The total number of rows.
   */
  count: _propTypes.default.number.isRequired,

  /**
   * Properties applied to the next arrow [`IconButton`](/api/icon-button/) element.
   */
  nextIconButtonProps: _propTypes.default.object,

  /**
   * Callback fired when the page is changed.
   *
   * @param {object} event The event source of the callback
   * @param {number} page The page selected
   */
  onChangePage: _propTypes.default.func.isRequired,

  /**
   * The zero-based index of the current page.
   */
  page: _propTypes.default.number.isRequired,

  /**
   * The number of rows per page.
   */
  rowsPerPage: _propTypes.default.number.isRequired,

  /**
   * @ignore
   */
  theme: _propTypes.default.object.isRequired
} : void 0;

var _default = (0, _withTheme.default)()(TablePaginationActions);

exports.default = _default;