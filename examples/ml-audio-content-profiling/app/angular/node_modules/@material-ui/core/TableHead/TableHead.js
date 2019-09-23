"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Tablelvl2Context = _interopRequireDefault(require("../Table/Tablelvl2Context"));

var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'table-header-group'
  }
};
exports.styles = styles;
var contextValue = {
  variant: 'head'
};

function TableHead(props) {
  var classes = props.classes,
      className = props.className,
      Component = props.component,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "component"]);
  return _react.default.createElement(_Tablelvl2Context.default.Provider, {
    value: contextValue
  }, _react.default.createElement(Component, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, className)
  }, other)));
}

process.env.NODE_ENV !== "production" ? TableHead.propTypes = {
  /**
   * The content of the component, normally `TableRow`.
   */
  children: _propTypes.default.node,

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
  component: _utils.componentPropType
} : void 0;
TableHead.defaultProps = {
  component: 'thead'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiTableHead'
})(TableHead);

exports.default = _default;