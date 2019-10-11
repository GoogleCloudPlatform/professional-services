'use strict';

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _jss = require('jss');

var _cssVendor = require('css-vendor');

var _cssVendor2 = _interopRequireDefault(_cssVendor);

var _detectBrowser = require('detect-browser');

var _detectBrowser2 = _interopRequireDefault(_detectBrowser);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var settings = {
  createGenerateClassName: function createGenerateClassName() {
    return function (rule) {
      return rule.key + '-id';
    };
  }
};

var isIE9 = _detectBrowser2['default'].name === 'ie' && _detectBrowser2['default'].version === '9.0.0';

describe('jss-vendor-prefixer', function () {
  var jss = void 0;

  beforeEach(function () {
    jss = (0, _jss.create)(settings).use((0, _index2['default'])());
  });

  describe('prefixed property', function () {
    if (isIE9) {
      return;
    }

    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { animation: 'yyy' }
      });
    });

    it('should generate correct CSS', function () {
      var prefixedProp = _cssVendor2['default'].supportedProperty('animation');
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  ' + prefixedProp + ': yyy;\n}');
    });
  });

  describe('@keyframes', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@keyframes a': {}
      });
    });

    it('should generate correct CSS', function () {
      var prefixedKeyframes = '@' + _cssVendor2['default'].prefix.css + 'keyframes';
      (0, _expect2['default'])(sheet.toString()).to.be(prefixedKeyframes + ' a {\n}');
    });
  });

  describe('unknown property', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { xxx: 'block' }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  xxx: block;\n}');
    });
  });

  describe('unknown value', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { display: 'yyy' }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  display: yyy;\n}');
    });
  });

  describe('unknown property and value', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { xxx: 'yyy' }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  xxx: yyy;\n}');
    });
  });

  describe('prefixed value', function () {
    if (isIE9) {
      return;
    }

    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { display: 'flex' }
      });
    });

    it('should generate correct CSS', function () {
      var supportedValue = _cssVendor2['default'].supportedValue('display', 'flex');
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  display: ' + supportedValue + ';\n}');
    });
  });

  describe('prefix function values', function () {
    if (isIE9) {
      return;
    }

    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: { display: function display() {
            return 'flex';
          } }
      });
      sheet.update();
    });

    it('should generate correct CSS', function () {
      var supportedValue = _cssVendor2['default'].supportedValue('display', 'flex');
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n  display: ' + supportedValue + ';\n}');
    });
  });
});