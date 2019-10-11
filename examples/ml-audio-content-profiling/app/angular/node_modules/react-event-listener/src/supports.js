function defineProperty(object, property, attr) {
  return Object.defineProperty(object, property, attr);
}

// Passive options
// Inspired by https://github.com/Modernizr/Modernizr/blob/master/feature-detects/dom/passiveeventlisteners.js
export const passiveOption = (() => {
  let cache = null;

  return (() => {
    if (cache !== null) {
      return cache;
    }

    let supportsPassiveOption = false;

    try {
      window.addEventListener(
        'test',
        null,
        defineProperty({}, 'passive', {
          get() {
            supportsPassiveOption = true;
          },
        }),
      );
    } catch (err) {
      //
    }

    cache = supportsPassiveOption;

    return supportsPassiveOption;
  })();
})();

export default {};
