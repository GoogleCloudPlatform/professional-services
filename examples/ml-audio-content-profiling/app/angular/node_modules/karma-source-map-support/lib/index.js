var path = require('path');

var smsPath = path.dirname(require.resolve('source-map-support'));

var createPattern = function(pattern) {
  return {pattern: pattern, included: true, served: true, watched: false};
};

var init = function(files) {
  files.unshift(createPattern(path.join(__dirname, 'client.js')));
  files.unshift(
    createPattern(path.join(smsPath, 'browser-source-map-support.js'))
  );
};

init.$inject = ['config.files'];

module.exports = {
  'framework:source-map-support': ['factory', init]
};
