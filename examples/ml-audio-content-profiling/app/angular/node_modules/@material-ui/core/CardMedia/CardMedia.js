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

var _warning = _interopRequireDefault(require("warning"));

var _utils = require("@material-ui/utils");

var _withStyles = _interopRequireDefault(require("../styles/withStyles"));

var styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'block',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  },

  /* Styles applied to the root element if `component="video, audio, picture, iframe, or img"`. */
  media: {
    width: '100%'
  }
};
exports.styles = styles;
var MEDIA_COMPONENTS = ['video', 'audio', 'picture', 'iframe', 'img'];

function CardMedia(props) {
  var classes = props.classes,
      className = props.className,
      Component = props.component,
      image = props.image,
      src = props.src,
      style = props.style,
      other = (0, _objectWithoutProperties2.default)(props, ["classes", "className", "component", "image", "src", "style"]);
  process.env.NODE_ENV !== "production" ? (0, _warning.default)(Boolean(image || src), 'Material-UI: either `image` or `src` property must be specified.') : void 0;
  var isMediaComponent = MEDIA_COMPONENTS.indexOf(Component) !== -1;
  var composedStyle = !isMediaComponent && image ? (0, _extends2.default)({
    backgroundImage: "url(\"".concat(image, "\")")
  }, style) : style;
  return _react.default.createElement(Component, (0, _extends2.default)({
    className: (0, _classnames.default)(classes.root, (0, _defineProperty2.default)({}, classes.media, isMediaComponent), className),
    style: composedStyle,
    src: isMediaComponent ? image || src : undefined
  }, other));
}

process.env.NODE_ENV !== "production" ? CardMedia.propTypes = {
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
   * Component for rendering image.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,

  /**
   * Image to be displayed as a background image.
   * Either `image` or `src` prop must be specified.
   * Note that caller must specify height otherwise the image will not be visible.
   */
  image: _propTypes.default.string,

  /**
   * An alias for `image` property.
   * Available only with media components.
   * Media components: `video`, `audio`, `picture`, `iframe`, `img`.
   */
  src: _propTypes.default.string,

  /**
   * @ignore
   */
  style: _propTypes.default.object
} : void 0;
CardMedia.defaultProps = {
  component: 'div'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiCardMedia'
})(CardMedia);

exports.default = _default;