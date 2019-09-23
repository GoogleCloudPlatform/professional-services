import _extends from "@babel/runtime/helpers/extends";
import PropTypes from 'prop-types';
import merge from './merge';

function omit(input, fields) {
  const output = {};
  Object.keys(input).forEach(prop => {
    if (fields.indexOf(prop) === -1) {
      output[prop] = input[prop];
    }
  });
  return output;
}

function css(styleFunction) {
  const newStyleFunction = props => {
    const output = styleFunction(props);

    if (props.css) {
      return _extends({}, merge(output, styleFunction(_extends({
        theme: props.theme
      }, props.css))), omit(props.css, [styleFunction.filterProps]));
    }

    return output;
  };

  newStyleFunction.propTypes = process.env.NODE_ENV !== 'production' ? _extends({}, styleFunction.propTypes, {
    css: PropTypes.object
  }) : {};
  newStyleFunction.filterProps = ['css', ...styleFunction.filterProps];
  return newStyleFunction;
}

export default css;