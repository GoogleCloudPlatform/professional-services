"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.MuiThemeProviderOld = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _warning = _interopRequireDefault(require("warning"));

var _brcast = _interopRequireDefault(require("brcast"));

var _utils = require("@material-ui/utils");

var _themeListener = _interopRequireWildcard(require("./themeListener"));

/* eslint-disable no-underscore-dangle */

/**
 * This component takes a `theme` property.
 * It makes the `theme` available down the React tree thanks to React context.
 * This component should preferably be used at **the root of your component tree**.
 */
var MuiThemeProviderOld =
/*#__PURE__*/
function (_React$Component) {
  (0, _inherits2.default)(MuiThemeProviderOld, _React$Component);

  // We are not using the React state in order to avoid unnecessary rerender.
  function MuiThemeProviderOld(props, context) {
    var _this;

    (0, _classCallCheck2.default)(this, MuiThemeProviderOld);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(MuiThemeProviderOld).call(this)); // Get the outer theme from the context, can be null

    _this.broadcast = (0, _brcast.default)();
    _this.outerTheme = _themeListener.default.initial(context); // Propagate the theme so it can be accessed by the children

    _this.broadcast.setState(_this.mergeOuterLocalTheme(props.theme));

    return _this;
  }

  (0, _createClass2.default)(MuiThemeProviderOld, [{
    key: "getChildContext",
    value: function getChildContext() {
      var _ref;

      var _this$props = this.props,
          disableStylesGeneration = _this$props.disableStylesGeneration,
          sheetsCache = _this$props.sheetsCache,
          sheetsManager = _this$props.sheetsManager;
      var muiThemeProviderOptions = this.context.muiThemeProviderOptions || {};

      if (disableStylesGeneration !== undefined) {
        muiThemeProviderOptions.disableStylesGeneration = disableStylesGeneration;
      }

      if (sheetsCache !== undefined) {
        muiThemeProviderOptions.sheetsCache = sheetsCache;
      }

      if (sheetsManager !== undefined) {
        muiThemeProviderOptions.sheetsManager = sheetsManager;
      }

      return _ref = {}, (0, _defineProperty2.default)(_ref, _themeListener.CHANNEL, this.broadcast), (0, _defineProperty2.default)(_ref, "muiThemeProviderOptions", muiThemeProviderOptions), _ref;
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      // Subscribe on the outer theme, if present
      this.unsubscribeId = _themeListener.default.subscribe(this.context, function (outerTheme) {
        _this2.outerTheme = outerTheme; // Forward the parent theme update to the children

        _this2.broadcast.setState(_this2.mergeOuterLocalTheme(_this2.props.theme));
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      // Propagate a local theme update
      if (this.props.theme !== prevProps.theme) {
        this.broadcast.setState(this.mergeOuterLocalTheme(this.props.theme));
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.unsubscribeId !== null) {
        _themeListener.default.unsubscribe(this.context, this.unsubscribeId);
      }
    } // Simple merge between the outer theme and the local theme

  }, {
    key: "mergeOuterLocalTheme",
    value: function mergeOuterLocalTheme(localTheme) {
      // To support composition of theme.
      if (typeof localTheme === 'function') {
        process.env.NODE_ENV !== "production" ? (0, _warning.default)(this.outerTheme, ['Material-UI: you are providing a theme function property ' + 'to the MuiThemeProvider component:', '<MuiThemeProvider theme={outerTheme => outerTheme} />', 'However, no outer theme is present.', 'Make sure a theme is already injected higher in the React tree ' + 'or provide a theme object.'].join('\n')) : void 0;
        return localTheme(this.outerTheme);
      }

      if (!this.outerTheme) {
        return localTheme;
      }

      return (0, _extends2.default)({}, this.outerTheme, localTheme);
    }
  }, {
    key: "render",
    value: function render() {
      // TODO move the sheetsManager property to a different component.
      // warning(
      //   typeof window !== 'undefined' || this.props.sheetsManager,
      //   [
      //     'Material-UI: you need to provide a sheetsManager to the MuiThemeProvider ' +
      //       'when rendering on the server.',
      //     'If you do not, you might experience a memory leak',
      //   ].join('\n'),
      // );
      return this.props.children;
    }
  }]);
  return MuiThemeProviderOld;
}(_react.default.Component);

exports.MuiThemeProviderOld = MuiThemeProviderOld;
process.env.NODE_ENV !== "production" ? MuiThemeProviderOld.propTypes = {
  /**
   * You can wrap a node.
   */
  children: _propTypes.default.node.isRequired,

  /**
   * You can disable the generation of the styles with this option.
   * It can be useful when traversing the React tree outside of the HTML
   * rendering step on the server.
   * Let's say you are using react-apollo to extract all
   * the queries made by the interface server-side.
   * You can significantly speed up the traversal with this property.
   */
  disableStylesGeneration: _propTypes.default.bool,

  /**
   * @ignore
   *
   * In beta.
   */
  sheetsCache: _propTypes.default.object,

  /**
   * The sheetsManager is used to deduplicate style sheet injection in the page.
   * It's deduplicating using the (theme, styles) couple.
   * On the server, you should provide a new instance for each request.
   */
  sheetsManager: _propTypes.default.object,

  /**
   * A theme object.
   */
  theme: _propTypes.default.oneOfType([_propTypes.default.object, _propTypes.default.func]).isRequired
} : void 0;

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV !== "production" ? MuiThemeProviderOld.propTypes = (0, _utils.exactProp)(MuiThemeProviderOld.propTypes) : void 0;
}

MuiThemeProviderOld.childContextTypes = (0, _extends2.default)({}, _themeListener.default.contextTypes, {
  muiThemeProviderOptions: _propTypes.default.object
});
MuiThemeProviderOld.contextTypes = (0, _extends2.default)({}, _themeListener.default.contextTypes, {
  muiThemeProviderOptions: _propTypes.default.object
});
/* istanbul ignore if */

if (!_utils.ponyfillGlobal.__MUI_STYLES__) {
  _utils.ponyfillGlobal.__MUI_STYLES__ = {};
}

if (!_utils.ponyfillGlobal.__MUI_STYLES__.MuiThemeProvider) {
  _utils.ponyfillGlobal.__MUI_STYLES__.MuiThemeProvider = MuiThemeProviderOld;
}

var _default = _utils.ponyfillGlobal.__MUI_STYLES__.MuiThemeProvider;
exports.default = _default;