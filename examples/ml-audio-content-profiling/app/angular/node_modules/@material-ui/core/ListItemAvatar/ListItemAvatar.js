"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _classnames = _interopRequireDefault(require("classnames"));

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _ListContext = _interopRequireDefault(require("../List/ListContext"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      width: 36,
      height: 36,
      fontSize: theme.typography.pxToRem(18),
      marginRight: 4
    },

    /* Styles applied to the root element when. */
    alignItemsFlexStart: {
      marginTop: 4
    },

    /* Styles applied to the children – typically the `Avatar` component. */
    icon: {
      width: 20,
      height: 20,
      fontSize: theme.typography.pxToRem(20)
    }
  };
};
/**
 * This is a simple wrapper to apply the `dense`
 * and `align-items="flex-start"` mode styles to `Avatar`.
 */


exports.styles = styles;

function ListItemAvatar(props) {
  var children = props.children,
      classes = props.classes,
      className = props.className,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className"]);
  return _react.default.createElement(_ListContext.default.Consumer, null, function (context) {
    var _classNames;

    return _react.default.cloneElement(children, (0, _extends2.default)({
      className: (0, _classnames.default)((_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.root, context.dense), (0, _defineProperty2.default)(_classNames, classes.alignItemsFlexStart, context.alignItems === 'flex-start'), _classNames), className, children.props.className),
      childrenClassName: (0, _classnames.default)((0, _defineProperty2.default)({}, classes.icon, context.dense), children.props.childrenClassName)
    }, other));
  });
}

process.env.NODE_ENV !== "production" ? ListItemAvatar.propTypes = {
  /**
   * The content of the component – normally `Avatar`.
   */
  children: _propTypes.default.element.isRequired,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes.default.object.isRequired,

  /**
   * @ignore
   */
  className: _propTypes.default.string
} : void 0;
ListItemAvatar.muiName = 'ListItemAvatar';

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiListItemAvatar'
})(ListItemAvatar);

exports.default = _default;