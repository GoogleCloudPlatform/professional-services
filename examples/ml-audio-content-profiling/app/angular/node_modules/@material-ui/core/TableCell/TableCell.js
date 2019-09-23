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

var _helpers = require("../utils/helpers");

var _deprecatedPropType = _interopRequireDefault(require("../utils/deprecatedPropType"));

var _colorManipulator = require("../styles/colorManipulator");

var _TableContext = _interopRequireDefault(require("../Table/TableContext"));

var _Tablelvl2Context = _interopRequireDefault(require("../Table/Tablelvl2Context"));

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'table-cell',
      verticalAlign: 'inherit',
      // Workaround for a rendering bug with spanned columns in Chrome 62.0.
      // Removes the alpha (sets it to 1), and lightens or darkens the theme color.
      borderBottom: "1px solid\n    ".concat(theme.palette.type === 'light' ? (0, _colorManipulator.lighten)((0, _colorManipulator.fade)(theme.palette.divider, 1), 0.88) : (0, _colorManipulator.darken)((0, _colorManipulator.fade)(theme.palette.divider, 1), 0.68)),
      textAlign: 'left',
      padding: '4px 56px 4px 24px',
      '&:last-child': {
        paddingRight: 24
      }
    },

    /* Styles applied to the root element if `variant="head"` or `context.table.head`. */
    head: {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12),
      fontWeight: theme.typography.fontWeightMedium
    },

    /* Styles applied to the root element if `variant="body"` or `context.table.body`. */
    body: {
      color: theme.palette.text.primary,
      fontSize: theme.typography.pxToRem(13),
      fontWeight: theme.typography.fontWeightRegular
    },

    /* Styles applied to the root element if `variant="footer"` or `context.table.footer`. */
    footer: {
      borderBottom: 0,
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12)
    },

    /* Styles applied to the root element if `numeric={true}`. */
    numeric: {
      textAlign: 'right',
      flexDirection: 'row-reverse' // can be dynamically inherited at runtime by contents

    },

    /* Styles applied to the root element if `padding="dense"`. */
    paddingDense: {
      paddingRight: 24
    },

    /* Styles applied to the root element if `padding="checkbox"`. */
    paddingCheckbox: {
      padding: '0 12px',
      '&:last-child': {
        paddingRight: 12
      }
    },

    /* Styles applied to the root element if `padding="none"`. */
    paddingNone: {
      padding: 0,
      '&:last-child': {
        padding: 0
      }
    },

    /* Styles applied to the root element if `align="left"`. */
    alignLeft: {
      textAlign: 'left'
    },

    /* Styles applied to the root element if `align="center"`. */
    alignCenter: {
      textAlign: 'center'
    },

    /* Styles applied to the root element if `align="right"`. */
    alignRight: {
      textAlign: 'right',
      flexDirection: 'row-reverse'
    },

    /* Styles applied to the root element if `align="justify"`. */
    alignJustify: {
      textAlign: 'justify'
    }
  };
};

exports.styles = styles;

function TableCell(props) {
  var align = props.align,
      children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      component = props.component,
      sortDirection = props.sortDirection,
      _props$numeric = props.numeric,
      numeric = _props$numeric === void 0 ? false : _props$numeric,
      paddingProp = props.padding,
      scopeProp = props.scope,
      variant = props.variant,
      other = (0, _objectWithoutProperties2.default)(props, ["align", "children", "classes", "className", "component", "sortDirection", "numeric", "padding", "scope", "variant"]);
  return _react.default.createElement(_TableContext.default.Consumer, null, function (table) {
    return _react.default.createElement(_Tablelvl2Context.default.Consumer, null, function (tablelvl2) {
      var _classNames;

      var Component;

      if (component) {
        Component = component;
      } else {
        Component = tablelvl2 && tablelvl2.variant === 'head' ? 'th' : 'td';
      }

      var scope = scopeProp;

      if (!scope && tablelvl2 && tablelvl2.variant === 'head') {
        scope = 'col';
      }

      var padding = paddingProp || (table && table.padding ? table.padding : 'default');
      var className = (0, _classnames.default)(classes.root, (_classNames = {}, (0, _defineProperty2.default)(_classNames, classes.head, variant ? variant === 'head' : tablelvl2 && tablelvl2.variant === 'head'), (0, _defineProperty2.default)(_classNames, classes.body, variant ? variant === 'body' : tablelvl2 && tablelvl2.variant === 'body'), (0, _defineProperty2.default)(_classNames, classes.footer, variant ? variant === 'footer' : tablelvl2 && tablelvl2.variant === 'footer'), (0, _defineProperty2.default)(_classNames, classes["align".concat((0, _helpers.capitalize)(align))], align !== 'inherit'), (0, _defineProperty2.default)(_classNames, classes.numeric, numeric), (0, _defineProperty2.default)(_classNames, classes["padding".concat((0, _helpers.capitalize)(padding))], padding !== 'default'), _classNames), classNameProp);
      var ariaSort = null;

      if (sortDirection) {
        ariaSort = sortDirection === 'asc' ? 'ascending' : 'descending';
      }

      return _react.default.createElement(Component, (0, _extends2.default)({
        className: className,
        "aria-sort": ariaSort,
        scope: scope
      }, other), children);
    });
  });
}

process.env.NODE_ENV !== "production" ? TableCell.propTypes = {
  /**
   * Set the text-align on the table cell content.
   *
   * Monetary or generally number fields **should be right aligned** as that allows
   * you to add them up quickly in your head without having to worry about decimals.
   */
  align: _propTypes.default.oneOf(['inherit', 'left', 'center', 'right', 'justify']),

  /**
   * The table cell contents.
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
   * If `true`, content will align to the right.
   */
  numeric: (0, _deprecatedPropType.default)(_propTypes.default.bool, 'Instead, use the `align` property.'),

  /**
   * Sets the padding applied to the cell.
   * By default, the Table parent component set the value.
   */
  padding: _propTypes.default.oneOf(['default', 'checkbox', 'dense', 'none']),

  /**
   * Set scope attribute.
   */
  scope: _propTypes.default.string,

  /**
   * Set aria-sort direction.
   */
  sortDirection: _propTypes.default.oneOf(['asc', 'desc', false]),

  /**
   * Specify the cell type.
   * By default, the TableHead, TableBody or TableFooter parent component set the value.
   */
  variant: _propTypes.default.oneOf(['head', 'body', 'footer'])
} : void 0;
TableCell.defaultProps = {
  align: 'inherit'
};

var _default = (0, _withStyles.default)(styles, {
  name: 'MuiTableCell'
})(TableCell);

exports.default = _default;