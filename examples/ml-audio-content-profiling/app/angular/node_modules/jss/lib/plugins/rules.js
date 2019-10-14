'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _SimpleRule = require('../rules/SimpleRule');

var _SimpleRule2 = _interopRequireDefault(_SimpleRule);

var _KeyframesRule = require('../rules/KeyframesRule');

var _KeyframesRule2 = _interopRequireDefault(_KeyframesRule);

var _ConditionalRule = require('../rules/ConditionalRule');

var _ConditionalRule2 = _interopRequireDefault(_ConditionalRule);

var _FontFaceRule = require('../rules/FontFaceRule');

var _FontFaceRule2 = _interopRequireDefault(_FontFaceRule);

var _ViewportRule = require('../rules/ViewportRule');

var _ViewportRule2 = _interopRequireDefault(_ViewportRule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var classes = {
  '@charset': _SimpleRule2['default'],
  '@import': _SimpleRule2['default'],
  '@namespace': _SimpleRule2['default'],
  '@keyframes': _KeyframesRule2['default'],
  '@media': _ConditionalRule2['default'],
  '@supports': _ConditionalRule2['default'],
  '@font-face': _FontFaceRule2['default'],
  '@viewport': _ViewportRule2['default'],
  '@-ms-viewport': _ViewportRule2['default']

  /**
   * Generate plugins which will register all rules.
   */
};
var plugins = Object.keys(classes).map(function (key) {
  // https://jsperf.com/indexof-vs-substr-vs-regex-at-the-beginning-3
  var re = new RegExp('^' + key);
  var RuleClass = classes[key];
  var onCreateRule = function onCreateRule(name, decl, options) {
    return re.test(name) ? new RuleClass(name, decl, options) : null;
  };
  return { onCreateRule: onCreateRule };
});

exports['default'] = plugins;