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

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 48,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      fontFamily: theme.typography.fontFamily
    },

    /* Styles applied to the root element if `titlePosition="bottom"`. */
    titlePositionBottom: {
      bottom: 0
    },

    /* Styles applied to the root element if `titlePosition="top"`. */
    titlePositionTop: {
      top: 0
    },

    /* Styles applied to the root element if a `subtitle` is provided. */
    rootSubtitle: {
      height: 68
    },

    /* Styles applied to the title and subtitle container element. */
    titleWrap: {
      flexGrow: 1,
      marginLeft: theme.mixins.gutters().paddingLeft,
      marginRight: theme.mixins.gutters().paddingRight,
      color: theme.palette.common.white,
      overflow: 'hidden'
    },

    /* Styles applied to the container element if `actionPosition="left"`. */
    titleWrapActionPosLeft: {
      marginLeft: 0
    },

    /* Styles applied to the container element if `actionPosition="right"`. */
    titleWrapActionPosRight: {
      marginRight: 0
    },

    /* Styles applied to the title container element. */
    title: {
      fontSize: theme.typography.pxToRem(16),
      lineHeight: '24px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    /* Styles applied to the subtitle container element. */
    subtitle: {
      fontSize: theme.typography.pxToRem(12),
      lineHeight: 1,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    /* Styles applied to the actionIcon if supplied. */
    actionIcon: {},

    /* Styles applied to the actionIcon if `actionPosition="left"`. */
    actionIconActionPosLeft: {
      order: -1
    }
  };
};

exports.styles = styles;

function GridListTileBar(props) {
  var _classNames, _classNames2;

  var actionIcon = props.actionIcon,
      actionPosition = props.actionPosition,
      classes = props.classes,
      classNameProp = props.className,
      subtitle = props.subtitle,
      title = props.title,
      titlePosition = props.titlePosition,
      other = (0, _objectWithoutProperties2.default)(props, ["actionIcon", "actionPosition", "classes", "className", "subtitle", "title", "titlePosition"]);
  var actionPos = actionIcon && actionPosition;
  var className = (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.titlePositionBottom, titlePosition === 'bottom'), (0, _defineProperty2.default)(_classNames, classes.titlePositionTop, titlePosition === 'top'), (0, _defineProperty2.default)(_classNames, classes.rootSubtitle, subtitle), _classNames), classNameProp); // Remove the margin between the title / subtitle wrapper, and the Action Icon

  var titleWrapClassName = (0, _classnames.default)(classes.titleWrap, (_classNames2 = {}, (0, _defineProperty2.default)(_classNames2, classes.titleWrapActionPosLeft, actionPos === 'left'), (0, _defineProperty2.default)(_classNames2, classes.titleWrapActionPosRight, actionPos === 'right'), _classNames2));
  return _react.default.createElement("div", (0, _extends2.default)({
    className: className
  }, other), _react.default.createElement("div", {
    className: titleWrapClassName
  }, _react.default.createElement("div", {
    className: classes.title
  }, title), subtitle ? _react.default.createElement("div", {
    className: classes.subtitle
  }, subtitle) : null), actionIcon ? _react.default.createElement("div", {
    className: (0, _classnames.default)(classes.actionIcon, (0, _defineProperty2.default)({}, classes.actionIconActionPosLeft, actionPos === 'left'))
  }, actionIcon) : null);
}

process.env.NODE_ENV !== "production" ? GridListTileBar.propTypes = {
  /**
   * An IconButton element to be used as secondary action target
   * (primary action target is the tile itself).
   */
  actionIcon: _propTypes.default.node,

  /**
   * Position of secondary action IconButton.
   */
  actionPosition: _propTypes.default.oneOf(['left', 'right']),

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
   * String or element serving as subtitle (support text).
   */
  subtitle: _propTypes.default.node,

  /**
   * Title to be displayed on tile.
   */
  title: _propTypes.default.node,

  /**
   * Position of the title bar.
   */
  titlePosition: _propTypes.default.oneOf(['top', 'bottom'])
} : void 0;
GridListTileBar.defaultProps = {
  actionPosition: 'right',
  titlePosition: 'bottom'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiGridListTileBar'
})(GridListTileBar);

exports.default = _default;