import React from 'react';
import pure from 'recompose/pure';
import SvgIcon from '../../SvgIcon';
/**
 * @ignore - internal component.
 */

var _ref = React.createElement("path", {
  d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
});

let Warning = props => React.createElement(SvgIcon, props, _ref);

Warning = pure(Warning);
Warning.muiName = 'SvgIcon';
export default Warning;