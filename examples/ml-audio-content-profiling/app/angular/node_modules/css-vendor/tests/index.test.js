'use strict';

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _index = require('./index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

describe('css-vendor', function () {
  describe('.prefix', function () {
    it('should be correct for .css', function () {
      var css = _index.prefix.css;

      (0, _expect2['default'])(css).to.be.a('string');
      (0, _expect2['default'])(css[0]).to.be('-');
      (0, _expect2['default'])(css[css.length - 1]).to.be('-');
      (0, _expect2['default'])(css.length >= 3).to.be(true);
    });

    it('shoud be not empty for .js', function () {
      (0, _expect2['default'])(_index.prefix.js).to.be.a('string');
    });
  });

  describe('.supportedProperty()', function () {
    it('should not prefix', function () {
      (0, _expect2['default'])((0, _index.supportedProperty)('display')).to.be('display');
    });

    it('should prefix if needed', function () {
      var prop = (0, _index.supportedProperty)(_index.prefix.css + 'animation');
      if (prop !== 'animation') {
        (0, _expect2['default'])(prop).to.be(_index.prefix.css + 'animation');
      }
    });

    it('should return false', function () {
      (0, _expect2['default'])((0, _index.supportedProperty)('xxx')).to.be(false);
    });
  });

  describe('.supportedValue()', function () {
    it('should not prefix a simple value', function () {
      (0, _expect2['default'])((0, _index.supportedValue)('display', 'none')).to.be('none');
    });

    it('should not prefix a complex value', function () {
      var value = 'rgba(255, 255, 255, 1.0)';
      (0, _expect2['default'])((0, _index.supportedValue)('color', value)).to.be(value);
    });

    it('should should prefix if needed', function () {
      var value = (0, _index.supportedValue)('display', 'flex');
      if (value !== 'flex') {
        (0, _expect2['default'])(value).to.be(_index.prefix.css + 'flex');
      }
    });

    it('should return false for unknown value', function () {
      (0, _expect2['default'])((0, _index.supportedValue)('display', 'xxx')).to.be(false);
    });

    it('should return false for "content" value', function () {
      (0, _expect2['default'])((0, _index.supportedValue)('content', 'bar')).to.be(false);
    });
  });
});