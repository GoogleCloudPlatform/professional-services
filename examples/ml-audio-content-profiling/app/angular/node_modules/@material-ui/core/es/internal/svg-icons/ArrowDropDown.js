import React from 'react';
import pure from 'recompose/pure';
import SvgIcon from '../../SvgIcon';
/**
 * @ignore - internal component.
 */

var _ref = React.createElement("path", {
  d: "M7 10l5 5 5-5z"
});

let ArrowDropDown = props => React.createElement(SvgIcon, props, _ref);

ArrowDropDown = pure(ArrowDropDown);
ArrowDropDown.muiName = 'SvgIcon';
export default ArrowDropDown;