'use strict';

var _templateObject = _taggedTemplateLiteral(['\n        .a-id {\n          width: 1px;\n        }\n      '], ['\n        .a-id {\n          width: 1px;\n        }\n      ']);

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _jssExpand = require('jss-expand');

var _jssExpand2 = _interopRequireDefault(_jssExpand);

var _jss = require('jss');

var _commonTags = require('common-tags');

var _zenObservable = require('zen-observable');

var _zenObservable2 = _interopRequireDefault(_zenObservable);

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

describe('jss-default-unit', function () {
  var jss = void 0;

  beforeEach(function () {
    jss = (0, _jss.create)(settings).use((0, _index2['default'])({ 'min-width': 'pc' }));
  });

  describe('unitless values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          zoom: 1
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  zoom: 1;\n' + '}');
    });
  });

  describe('values with px units', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          width: 10
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  width: 10px;\n' + '}');
    });
  });

  describe('values with ms units', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'animation-duration': 200
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  animation-duration: 200ms;\n' + '}');
    });
  });

  describe('values with % units', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'transform-origin-x': 50
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  transform-origin-x: 50%;\n' + '}');
    });
  });

  describe('leave non-regular rules unchanged', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@font-face': {
          'font-family': 'MyHelvetica',
          src: 'local("Helvetica")'
        },
        '@media print': {
          a: {
            'border-left': 1,
            border: 3
          }
        },
        '@keyframes id': {
          from: { top: 0 },
          '30%': { top: 30 },
          '60%, 70%': { top: 80 }
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('@font-face {\n' + '  font-family: MyHelvetica;\n' + '  src: local("Helvetica");\n' + '}\n' + '@media print {\n' + '  .a-id {\n' + '    border-left: 1px;\n' + '    border: 3px;\n' + '  }\n' + '}\n' + '@keyframes id {\n' + '  from {\n' + '    top: 0;\n' + '  }\n' + '  30% {\n' + '    top: 30px;\n' + '  }\n' + '  60%, 70% {\n' + '    top: 80px;\n' + '  }\n' + '}');
    });
  });

  describe('comma-separated values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'background-size': [10, 15]
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  background-size: 10px, 15px;\n' + '}');
    });
  });

  describe('comma-separated values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'background-size': [[10, 5]]
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  background-size: 10px 5px;\n' + '}');
    });
  });

  describe('customized units via options object', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'min-width': 20
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  min-width: 20pc;\n' + '}');
    });
  });

  describe('ignore falsy values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          padding: 10,
          margin: null
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  padding: 10px;\n' + '}');
    });
  });

  describe('add default units to fallbacks', function () {
    var sheet = void 0;

    beforeEach(function () {
      var localJss = (0, _jss.create)(settings).use((0, _index2['default'])());
      sheet = localJss.createStyleSheet({
        a: {
          padding: 1,
          fallbacks: {
            padding: 5
          }
        },
        b: {
          padding: 1,
          fallbacks: [{ padding: 5 }, { padding: 10 }]
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  padding: 5px;\n' + '  padding: 1px;\n' + '}\n' + '.b-id {\n' + '  padding: 5px;\n' + '  padding: 10px;\n' + '  padding: 1px;\n' + '}');
    });
  });

  describe('add default units in combination with expand plugin', function () {
    var sheet = void 0;

    beforeEach(function () {
      var localJss = (0, _jss.create)(settings).use((0, _index2['default'])({ 'padding-top': 'rem' }), (0, _jssExpand2['default'])());
      sheet = localJss.createStyleSheet({
        a: {
          padding: {
            top: 5,
            left: 0,
            right: 10,
            bottom: 15
          }
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  padding: 5rem 10px 15px 0;\n' + '}');
    });
  });

  describe('add default units in combination with expand plugin (objects inside arrays)', function () {
    var sheet = void 0;

    beforeEach(function () {
      var localJss = (0, _jss.create)(settings).use((0, _index2['default'])(), (0, _jssExpand2['default'])());
      sheet = localJss.createStyleSheet({
        a: {
          transition: [{
            timingFunction: 'linear',
            delay: 100,
            property: 'opacity',
            duration: 200
          }, {
            timingFunction: 'linear',
            property: 'transform',
            duration: 300
          }]
        }
      });
    });

    it('should add rule', function () {
      (0, _expect2['default'])(sheet.getRule('a')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  transition: opacity 200ms linear 100ms, transform 300ms linear;\n' + '}');
    });
  });

  describe('support camel cased units', function () {
    it('should work with default units', function () {
      var sheet = jss.createStyleSheet({
        a: {
          borderBottom: 10
        }
      });
      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  borderBottom: 10px;\n' + '}');
    });

    it('should work with user units', function () {
      var localJss = (0, _jss.create)(settings).use((0, _index2['default'])({ borderBottom: 'pc' }));

      var sheet = localJss.createStyleSheet({
        a: {
          borderBottom: 10
        }
      });

      (0, _expect2['default'])(sheet.toString()).to.be('.a-id {\n' + '  borderBottom: 10pc;\n' + '}');
    });
  });

  describe('support function values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          width: function width() {
            return 1;
          }
        }
      });
      sheet.update();
    });

    it('should add default unit', function () {
      (0, _expect2['default'])(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject));
    });
  });

  describe('support observable values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          width: new _zenObservable2['default'](function (observer) {
            observer.next(1);
          })
        }
      });
    });

    it('should add default unit', function () {
      (0, _expect2['default'])(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject));
    });
  });
});