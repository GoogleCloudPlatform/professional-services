import _extends from "@babel/runtime/helpers/extends";
import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import FormControlContext from './FormControlContext';
import { getDisplayName } from '@material-ui/utils';
export default function withFormControlContext(Component) {
  const EnhancedComponent = props => React.createElement(FormControlContext.Consumer, null, context => React.createElement(Component, _extends({
    muiFormControl: context
  }, props)));

  if (process.env.NODE_ENV !== 'production') {
    EnhancedComponent.displayName = `WithFormControlContext(${getDisplayName(Component)})`;
  }

  hoistNonReactStatics(EnhancedComponent, Component);
  return EnhancedComponent;
}