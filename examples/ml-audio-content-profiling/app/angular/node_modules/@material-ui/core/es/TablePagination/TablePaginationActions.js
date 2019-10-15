import _extends from "@babel/runtime/helpers/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import React from 'react';
import PropTypes from 'prop-types';
import KeyboardArrowLeft from '../internal/svg-icons/KeyboardArrowLeft';
import KeyboardArrowRight from '../internal/svg-icons/KeyboardArrowRight';
import withTheme from '../styles/withTheme';
import IconButton from '../IconButton';
/**
 * @ignore - internal component.
 */

var _ref = React.createElement(KeyboardArrowRight, null);

var _ref2 = React.createElement(KeyboardArrowLeft, null);

var _ref3 = React.createElement(KeyboardArrowLeft, null);

var _ref4 = React.createElement(KeyboardArrowRight, null);

class TablePaginationActions extends React.Component {
  constructor(...args) {
    super(...args);

    this.handleBackButtonClick = event => {
      this.props.onChangePage(event, this.props.page - 1);
    };

    this.handleNextButtonClick = event => {
      this.props.onChangePage(event, this.props.page + 1);
    };
  }

  render() {
    const _this$props = this.props,
          {
      backIconButtonProps,
      count,
      nextIconButtonProps,
      page,
      rowsPerPage,
      theme
    } = _this$props,
          other = _objectWithoutPropertiesLoose(_this$props, ["backIconButtonProps", "count", "nextIconButtonProps", "onChangePage", "page", "rowsPerPage", "theme"]);

    return React.createElement("div", other, React.createElement(IconButton, _extends({
      onClick: this.handleBackButtonClick,
      disabled: page === 0,
      color: "inherit"
    }, backIconButtonProps), theme.direction === 'rtl' ? _ref : _ref2), React.createElement(IconButton, _extends({
      onClick: this.handleNextButtonClick,
      disabled: page >= Math.ceil(count / rowsPerPage) - 1,
      color: "inherit"
    }, nextIconButtonProps), theme.direction === 'rtl' ? _ref3 : _ref4));
  }

}

process.env.NODE_ENV !== "production" ? TablePaginationActions.propTypes = {
  /**
   * Properties applied to the back arrow [`IconButton`](/api/icon-button/) element.
   */
  backIconButtonProps: PropTypes.object,

  /**
   * The total number of rows.
   */
  count: PropTypes.number.isRequired,

  /**
   * Properties applied to the next arrow [`IconButton`](/api/icon-button/) element.
   */
  nextIconButtonProps: PropTypes.object,

  /**
   * Callback fired when the page is changed.
   *
   * @param {object} event The event source of the callback
   * @param {number} page The page selected
   */
  onChangePage: PropTypes.func.isRequired,

  /**
   * The zero-based index of the current page.
   */
  page: PropTypes.number.isRequired,

  /**
   * The number of rows per page.
   */
  rowsPerPage: PropTypes.number.isRequired,

  /**
   * @ignore
   */
  theme: PropTypes.object.isRequired
} : void 0;
export default withTheme()(TablePaginationActions);