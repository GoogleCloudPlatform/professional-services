import React from 'react';
import PropTypes from 'prop-types';
import ListContext from '../List/ListContext';
/**
 * @ignore - internal component.
 *
 * Consumes a context and passes that context merged with its props.
 */

function MergeListContext(props) {
  const {
    alignItems,
    children,
    dense
  } = props;
  return React.createElement(ListContext.Consumer, null, context => {
    const childContext = {
      dense: dense || context.dense || false,
      alignItems
    };
    return React.createElement(ListContext.Provider, {
      value: childContext
    }, children(childContext));
  });
}

process.env.NODE_ENV !== "production" ? MergeListContext.propTypes = {
  alignItems: PropTypes.oneOf(['flex-start', 'center']).isRequired,
  children: PropTypes.func.isRequired,
  dense: PropTypes.bool.isRequired
} : void 0;
export default MergeListContext;