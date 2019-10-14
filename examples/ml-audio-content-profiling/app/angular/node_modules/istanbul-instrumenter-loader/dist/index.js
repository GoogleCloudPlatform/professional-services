'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (source, sourceMap) {
  var _this = this;

  var options = Object.assign({ produceSourceMap: true }, _loaderUtils2.default.getOptions(this));

  (0, _schemaUtils2.default)(schema, options, 'Istanbul Instrumenter Loader');

  var srcMap = sourceMap;
  // use inline source map, if any
  if (!srcMap) {
    var inlineSourceMap = _convertSourceMap2.default.fromSource(source);
    if (inlineSourceMap) {
      srcMap = inlineSourceMap.sourcemap;
    }
  }

  var instrumenter = (0, _istanbulLibInstrument.createInstrumenter)(options);

  instrumenter.instrument(source, this.resourcePath, function (error, instrumentedSource) {
    _this.callback(error, instrumentedSource, instrumenter.lastSourceMap());
  }, srcMap);
};

var _istanbulLibInstrument = require('istanbul-lib-instrument');

var _loaderUtils = require('loader-utils');

var _loaderUtils2 = _interopRequireDefault(_loaderUtils);

var _schemaUtils = require('schema-utils');

var _schemaUtils2 = _interopRequireDefault(_schemaUtils);

var _convertSourceMap = require('convert-source-map');

var _convertSourceMap2 = _interopRequireDefault(_convertSourceMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable-line */
var schema = require('./options');