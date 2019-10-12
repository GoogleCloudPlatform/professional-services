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

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var _Typography = _interopRequireDefault(require("../Typography"));

var _ListContext = _interopRequireDefault(require("../List/ListContext"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      flex: '1 1 auto',
      minWidth: 0,
      padding: '0 16px',
      '&:first-child': {
        paddingLeft: 0
      }
    },

    /* Styles applied to the root element if `inset={true}`. */
    inset: {
      '&:first-child': {
        paddingLeft: 56
      }
    },

    /* Styles applied to the root element if `context.dense` is `true`. */
    dense: {
      fontSize: theme.typography.pxToRem(13)
    },

    /* Styles applied to the primary `Typography` component. */
    primary: {
      '&$textDense': {
        fontSize: 'inherit'
      }
    },

    /* Styles applied to the secondary `Typography` component. */
    secondary: {
      '&$textDense': {
        fontSize: 'inherit'
      }
    },

    /* Styles applied to the `Typography` components if `context.dense` is `true`. */
    textDense: {}
  };
};

exports.styles = styles;

function ListItemText(props) {
  var children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      disableTypography = props.disableTypography,
      inset = props.inset,
      primaryProp = props.primary,
      primaryTypographyProps = props.primaryTypographyProps,
      secondaryProp = props.secondary,
      secondaryTypographyProps = props.secondaryTypographyProps,
      theme = props.theme,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "disableTypography", "inset", "primary", "primaryTypographyProps", "secondary", "secondaryTypographyProps", "theme"]);
  return _react.default.createElement(_ListContext.default.Consumer, null, function (_ref) {
    var _classNames3;

    var dense = _ref.dense;
    var primary = primaryProp != null ? primaryProp : children;

    if (primary != null && primary.type !== _Typography.default && !disableTypography) {
      primary = _react.default.createElement(_Typography.default, (0, _extends2.default)({
        variant: theme.typography.useNextVariants ? 'body1' : 'subheading',
        className: (0, _classnames.default)(classes.primary, (0, _defineProperty2.default)({}, classes.textDense, dense)),
        component: "span"
      }, primaryTypographyProps), primary);
    }

    var secondary = secondaryProp;

    if (secondary != null && secondary.type !== _Typography.default && !disableTypography) {
      secondary = _react.default.createElement(_Typography.default, (0, _extends2.default)({
        className: (0, _classnames.default)(classes.secondary, (0, _defineProperty2.default)({}, classes.textDense, dense)),
        color: "textSecondary"
      }, secondaryTypographyProps), secondary);
    }

    return _react.default.createElement("div", (0, _extends2.default)({
      className: (0, _classnames.default)(classes.root, (_classNames3 = {}, (0, _defineProperty2.default)(_classNames3, classes.dense, dense), (0, _defineProperty2.default)(_classNames3, classes.inset, inset), _classNames3), classNameProp)
    }, other), primary, secondary);
  });
}

process.env.NODE_ENV !== "production" ? ListItemText.propTypes = {
  /**
   * Alias for the `primary` property.
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
   * If `true`, the children won't be wrapped by a Typography component.
   * This can be useful to render an alternative Typography variant by wrapping
   * the `children` (or `primary`) text, and optional `secondary` text
   * with the Typography component.
   */
  disableTypography: _propTypes.default.bool,

  /**
   * If `true`, the children will be indented.
   * This should be used if there is no left avatar or left icon.
   */
  inset: _propTypes.default.bool,

  /**
   * The main content element.
   */
  primary: _propTypes.default.node,

  /**
   * These props will be forwarded to the primary typography component
   * (as long as disableTypography is not `true`).
   */
  primaryTypographyProps: _propTypes.default.object,

  /**
   * The secondary content element.
   */
  secondary: _propTypes.default.node,

  /**
   * These props will be forwarded to the secondary typography component
   * (as long as disableTypography is not `true`).
   */
  secondaryTypographyProps: _propTypes.default.object,

  /**
   * @ignore
   */
  theme: _propTypes.default.object.isRequired
} : void 0;
ListItemText.defaultProps = {
  disableTypography: false,
  inset: false
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiListItemText',
  withTheme: true
})(ListItemText);

exports.default = _default;