'use strict';

var _templateObject = _taggedTemplateLiteral(['\n        .a-id:hover {\n          color: red;\n        }\n        @media {\n          .a-id:hover {\n            color: green;\n          }\n        }\n      '], ['\n        .a-id:hover {\n          color: red;\n        }\n        @media {\n          .a-id:hover {\n            color: green;\n          }\n        }\n      ']),
    _templateObject2 = _taggedTemplateLiteral(['\n        .a-id:hover {\n          color: red;\n        }\n      '], ['\n        .a-id:hover {\n          color: red;\n        }\n      ']),
    _templateObject3 = _taggedTemplateLiteral(['\n        .a-id:hover {\n          color: green;\n        }\n      '], ['\n        .a-id:hover {\n          color: green;\n        }\n      ']);

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _commonTags = require('common-tags');

var _ = require('./');

var _2 = _interopRequireDefault(_);

var _jssExtend = require('jss-extend');

var _jssExtend2 = _interopRequireDefault(_jssExtend);

var _jss = require('jss');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); } /* eslint-disable no-underscore-dangle */

var settings = {
  createGenerateClassName: function createGenerateClassName() {
    return function (rule) {
      return rule.key + '-id';
    };
  }
};

describe('jss-nested', function () {
  var jss = void 0;
  var warning = void 0;

  beforeEach(function () {
    _2.default.__Rewire__('warning', function (condition, message) {
      warning = message;
    });

    jss = (0, _jss.create)(settings).use((0, _2.default)());
  });

  afterEach(function () {
    _2.default.__ResetDependency__('warning');
    warning = undefined;
  });

  describe('nesting with space', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          float: 'left',
          '& b': { float: 'left' }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.a-id b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  float: left;\n' + '}\n' + '.a-id b {\n' + '  float: left;\n' + '}');
    });
  });

  describe('nesting without space', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          float: 'left',
          '&b': { float: 'left' }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.a-idb')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  float: left;\n' + '}\n' + '.a-idb {\n' + '  float: left;\n' + '}');
    });
  });

  describe('multi nesting', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          float: 'left',
          '&b': { float: 'left' },
          '& c': { float: 'left' }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.a-idb')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.a-id c')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  float: left;\n' + '}\n' + '.a-idb {\n' + '  float: left;\n' + '}\n' + '.a-id c {\n' + '  float: left;\n' + '}');
    });
  });

  describe('multi nesting in one selector', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          float: 'left',
          '&b, &c': { float: 'left' }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.a-idb, .a-idc')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  float: left;\n' + '}\n' + '.a-idb, .a-idc {\n' + '  float: left;\n' + '}');
    });
  });

  describe('.addRules()', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          height: '1px'
        }
      });

      sheet.addRules({
        b: {
          height: '2px',
          '& c': {
            height: '3px'
          }
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  height: 1px;\n' + '}\n' + '.b-id {\n' + '  height: 2px;\n' + '}\n' + '.b-id c {\n' + '  height: 3px;\n' + '}');
    });
  });

  describe('nesting in a conditional', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          color: 'green'
        },
        '@media': {
          a: {
            '&:hover': { color: 'red' }
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  color: green;\n' + '}\n' + '@media {\n' + '  .a-id:hover {\n' + '    color: red;\n' + '  }\n' + '}');
    });
  });

  describe('nesting a conditional rule inside a regular rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          color: 'green',
          '@media': {
            width: '200px'
          }
        },
        b: {
          color: 'red'
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  color: green;\n' + '}\n' + '@media {\n' + '  .a-id {\n' + '    width: 200px;\n' + '  }\n' + '}\n' + '.b-id {\n' + '  color: red;\n' + '}');
    });
  });

  describe('nesting a conditional rule inside of a nested rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          '&:hover': {
            color: 'red',
            '@media': {
              color: 'green'
            }
          }
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject));
    });
  });

  describe('order of nested conditionals', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          '@media a': {
            color: 'red'
          },
          '@media b': {
            color: 'green'
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('@media a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('@media a {\n' + '  .a-id {\n' + '    color: red;\n' + '  }\n' + '}\n' + '@media b {\n' + '  .a-id {\n' + '    color: green;\n' + '  }\n' + '}');
    });
  });

  describe('adding a rule with a conditional rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet();
      sheet.addRule('a', {
        color: 'green',
        '@media': {
          width: '200px'
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  color: green;\n' + '}\n' + '@media {\n' + '  .a-id {\n' + '    width: 200px;\n' + '  }\n' + '}');
    });
  });

  describe('do not merge nested conditional to container conditional with existing rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          color: 'green',
          '@media': {
            width: '200px'
          },
          '@media large': {
            width: '300px'
          }
        },
        '@media': {
          b: {
            color: 'blue'
          }
        },
        c: {
          color: 'red'
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('c')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  color: green;\n' + '}\n' + '@media {\n' + '  .a-id {\n' + '    width: 200px;\n' + '  }\n' + '}\n' + '@media large {\n' + '  .a-id {\n' + '    width: 300px;\n' + '  }\n' + '}\n' + '@media {\n' + '  .b-id {\n' + '    color: blue;\n' + '  }\n' + '}\n' + '.c-id {\n' + '  color: red;\n' + '}');
    });
  });

  describe('warnings', function () {
    it('should warn when referenced rule is not found', function () {
      jss.createStyleSheet({
        a: {
          '& $b': { float: 'left' }
        }
      });

      (0, _expect2.default)(warning).to.be('[JSS] Could not find the referenced rule %s in %s.');
    });
  });

  describe('local refs', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          float: 'left',
          '& $b': { float: 'left' },
          '& $b-warn': { float: 'right' }
        },
        b: {
          color: 'red'
        },
        'b-warn': {
          color: 'orange'
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.a-id {\n' + '  float: left;\n' + '}\n' + '.a-id .b-id {\n' + '  float: left;\n' + '}\n' + '.a-id .b-warn-id {\n' + '  float: right;\n' + '}\n' + '.b-id {\n' + '  color: red;\n' + '}\n' + '.b-warn-id {\n' + '  color: orange;\n' + '}');
    });
  });

  describe('nesting conditionals in combination with extend plugin', function () {
    var sheet = void 0;

    beforeEach(function () {
      var localJss = (0, _jss.create)(settings).use((0, _jssExtend2.default)(), (0, _2.default)());
      sheet = localJss.createStyleSheet({
        button: {
          color: 'green',
          'background-color': 'aqua',
          '@media': {
            width: '200px'
          }
        },
        redButton: {
          extend: 'button',
          color: 'red'
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('@media')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('redButton')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.button-id {\n' + '  color: green;\n' + '  background-color: aqua;\n' + '}\n' + '@media {\n' + '  .button-id {\n' + '    width: 200px;\n' + '  }\n' + '}\n' + '.redButton-id {\n' + '  color: red;\n' + '  background-color: aqua;\n' + '}\n' + '@media {\n' + '  .redButton-id {\n' + '    width: 200px;\n' + '  }\n' + '}');
    });
  });

  describe('deep nesting', function () {
    var sheet = void 0;

    beforeEach(function () {
      var localJss = (0, _jss.create)(settings).use((0, _jssExtend2.default)(), (0, _2.default)());
      sheet = localJss.createStyleSheet({
        button: {
          color: 'black',
          '& .a': {
            color: 'red',
            '& .c': {
              color: 'gold'
            }
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.button-id .a')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.button-id .a .c')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.button-id {\n' + '  color: black;\n' + '}\n' + '.button-id .a {\n' + '  color: red;\n' + '}\n' + '.button-id .a .c {\n' + '  color: gold;\n' + '}');
    });
  });

  describe('deep nesting with multiple nestings in one selector', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        button: {
          color: 'black',
          '& .a, .b': {
            color: 'red',
            '& .c, &:hover': {
              color: 'gold'
            }
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2.default)(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.button-id .a, .button-id .b')).to.not.be(undefined);
      (0, _expect2.default)(sheet.getRule('.button-id .a .c, .button-id .a:hover, ' + '.button-id .b .c, .button-id .b:hover')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('.button-id {\n' + '  color: black;\n' + '}\n' + '.button-id .a, .button-id .b {\n' + '  color: red;\n' + '}\n' + '.button-id .a .c, .button-id .a:hover, ' + '.button-id .b .c, .button-id .b:hover {\n' + '  color: gold;\n' + '}');
    });
  });

  describe('support & at any position', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          'input:focus + &': {
            color: 'red'
          }
        }
      });
    });

    it('should generate correct CSS', function () {
      (0, _expect2.default)(sheet.toString()).to.be('input:focus + .a-id {\n' + '  color: red;\n' + '}');
    });
  });

  describe('function values', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        a: {
          '&:hover': {
            color: function color(_ref) {
              var _color = _ref.color;
              return _color;
            }
          }
        }
      });
    });

    it('should generate color red', function () {
      sheet.update({ color: 'red' });
      (0, _expect2.default)(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject2));
    });

    it('should generate color green', function () {
      sheet.update({ color: 'green' });
      (0, _expect2.default)(sheet.toString()).to.be((0, _commonTags.stripIndent)(_templateObject3));
    });
  });
});