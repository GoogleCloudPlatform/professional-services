'use strict';

var _templateObject = _taggedTemplateLiteral(['\n        .a-id {\n          font-size: 12;\n        }\n      '], ['\n        .a-id {\n          font-size: 12;\n        }\n      ']);

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _commonTags = require('common-tags');

var _jss = require('jss');

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var settings = {
  createGenerateClassName: function createGenerateClassName() {
    return function (rule) {
      return rule.key + '-id';
    };
  }
};

describe('jss-camel-case', function () {
  var jss = void 0;

  beforeEach(function () {
    jss = (0, _jss.create)(settings).use((0, _index2['default'])());
  });

  describe('regular rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          fontSize: '20px',
          zIndex: 1,
          lineHeight: 1.2
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  font-size: 20px;\n  z-index: 1;\n  line-height: 1.2;\n}');
    });
  });

  describe('@font-face with array of styles', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@font-face': [{
          fontFamily: 'Lato-Light',
          src: 'url("/fonts/Lato-Light.ttf") format("truetype")'
        }, {
          fontFamily: 'Lato-Bold',
          src: 'url("/fonts/Lato-Bold.ttf") format("truetype")'
        }]
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('@font-face {\n' + '  font-family: Lato-Light;\n' + '  src: url("/fonts/Lato-Light.ttf") format("truetype");\n' + '}\n' + '@font-face {\n' + '  font-family: Lato-Bold;\n' + '  src: url("/fonts/Lato-Bold.ttf") format("truetype");\n' + '}');
    });
  });

  describe('fallbacks object', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@font-face': {
          fontFamily: 'MyWebFont',
          fallbacks: {
            fontFamily: 'MyWebFontFallback'
          }
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('@font-face {\n' + '  font-family: MyWebFontFallback;\n' + '  font-family: MyWebFont;\n' + '}');
    });
  });

  describe('fallbacks array', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@font-face': {
          fontFamily: 'MyWebFont',
          fallbacks: [{ fontFamily: 'MyWebFontFallback' }]
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('@font-face {\n' + '  font-family: MyWebFontFallback;\n' + '  font-family: MyWebFont;\n' + '}');
    });
  });

  describe('font faces with fallbacks', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@font-face': [{
          fontFamily: 'MyWebFont',
          fallbacks: {
            fontFamily: 'MyWebFontFallback'
          }
        }]
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('@font-face {\n' + '  font-family: MyWebFontFallback;\n' + '  font-family: MyWebFont;\n' + '}');
    });
  });

  describe('function values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          fontSize: function fontSize() {
            return 12;
          }
        }
      });
    });

    it('should generate correct CSS', function () {
      sheet.update();
      (0, _expect2['default'])(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject));
    });
  });
});