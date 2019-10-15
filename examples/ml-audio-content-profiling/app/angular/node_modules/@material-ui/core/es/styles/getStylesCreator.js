import _extends from "@babel/runtime/helpers/extends";
import warning from 'warning';
import deepmerge from 'deepmerge'; // < 1kb payload overhead when lodash/merge is > 3kb.
// Support for the jss-expand plugin.

function arrayMerge(destination, source) {
  return source;
}

function getStylesCreator(stylesOrCreator) {
  const themingEnabled = typeof stylesOrCreator === 'function';
  process.env.NODE_ENV !== "production" ? warning(typeof stylesOrCreator === 'object' || themingEnabled, ['Material-UI: the first argument provided to withStyles() is invalid.', 'You need to provide a function generating the styles or a styles object.'].join('\n')) : void 0;

  function create(theme, name) {
    const styles = themingEnabled ? stylesOrCreator(theme) : stylesOrCreator;

    if (!name || !theme.overrides || !theme.overrides[name]) {
      return styles;
    }

    const overrides = theme.overrides[name];

    const stylesWithOverrides = _extends({}, styles);

    Object.keys(overrides).forEach(key => {
      process.env.NODE_ENV !== "production" ? warning(stylesWithOverrides[key], ['Material-UI: you are trying to override a style that does not exist.', `Fix the \`${key}\` key of \`theme.overrides.${name}\`.`].join('\n')) : void 0;
      stylesWithOverrides[key] = deepmerge(stylesWithOverrides[key], overrides[key], {
        arrayMerge
      });
    });
    return stylesWithOverrides;
  }

  return {
    create,
    options: {},
    themingEnabled
  };
}

export default getStylesCreator;