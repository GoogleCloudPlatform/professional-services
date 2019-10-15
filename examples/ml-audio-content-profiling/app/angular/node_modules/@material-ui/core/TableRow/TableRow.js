"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Tablelvl2Context = _interopRequireDefault(require("../Table/Tablelvl2Context"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      color: 'inherit',
      display: 'table-row',
      height: 48,
      verticalAlign: 'middle',
      // We disable the focus ring for mouse, touch and keyboard users.
      outline: 'none',
      '&$selected': {
        backgroundColor: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.04)' // grey[100]
        : 'rgba(255, 255, 255, 0.08)'
      },
      '&$hover:hover': {
        backgroundColor: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.07)' // grey[200]
        : 'rgba(255, 255, 255, 0.14)'
      }
    },

    /* Styles applied to the root element if `selected={true}`. */
    selected: {},

    /* Styles applied to the root element if `hover={true}`. */
    hover: {},

    /* Styles applied to the root element if table variant = 'head'. */
    head: {
      height: 56
    },

    /* Styles applied to the root element if table variant = 'footer'. */
    footer: {
      height: 56
    }
  };
};
/**
 * Will automatically set dynamic row height
 * based on the material table element parent (head, body, etc).
 */


exports.styles = styles;

function TableRow(props) {
  var classes = props.classes,
      classNameProp = props.className,
      Component = props.component,
      hover = props.hover,
      selected = props.selected,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "component", "hover", "selected"]);
  return _react.default.createElement(_Tablelvl2Context.default.Consumer, null, function (tablelvl2) {
    var _classNames;

    var className = (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.head, tablelvl2 && tablelvl2.variant === 'head'), (0, _defineProperty2.default)(_classNames, classes.footer, tablelvl2 && tablelvl2.variant === 'footer'), (0, _defineProperty2.default)(_classNames, classes.hover, hover), (0, _defineProperty2.default)(_classNames, classes.selected, selected), _classNames), classNameProp);
    return _react.default.createElement(Component, (0, _extends2.default)({
      className: className
    }, other));
  });
}

process.env.NODE_ENV !== "production" ? TableRow.propTypes = {
  /**
   * Should be valid <tr> children such as `TableCell`.
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
  component: _utils.componentPropType,

  /**
   * If `true`, the table row will shade on hover.
   */
  hover: _propTypes.default.bool,

  /**
   * If `true`, the table row will have the selected shading.
   */
  selected: _propTypes.default.bool
} : void 0;
TableRow.defaultProps = {
  component: 'tr',
  hover: false,
  selected: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiTableRow'
})(TableRow);

exports.default = _default;