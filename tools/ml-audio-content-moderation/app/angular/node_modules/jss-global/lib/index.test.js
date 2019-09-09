'use strict';

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _jss = require('jss');

var _jssNested = require('jss-nested');

var _jssNested2 = _interopRequireDefault(_jssNested);

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

describe('jss-global', function () {
  var jss = void 0;

  beforeEach(function () {
    jss = (0, _jss.create)(settings).use((0, _index2['default'])());
  });

  describe('@global root container', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@global': {
          a: { color: 'red' },
          body: { color: 'green' }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('@global')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('a')).to.be(undefined);
      (0, _expect2['default'])(sheet.getRule('body')).to.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('a {\n' + '  color: red;\n' + '}\n' + 'body {\n' + '  color: green;\n' + '}');
    });
  });

  describe('@global root prefix', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        '@global body': {
          color: 'red'
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('body')).to.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('body {\n' + '  color: red;\n' + '}');
    });
  });

  describe('@global scoped container', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        button: {
          float: 'left',
          '@global': {
            span: { color: 'red' }
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('.button-id span')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.button-id {\n' + '  float: left;\n' + '}\n' + '.button-id span {\n' + '  color: red;\n' + '}');
    });
  });

  describe('@global scoped container with comma separate selectors', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        button: {
          float: 'left',
          '@global': {
            'a, b': { color: 'red' }
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('.button-id a, .button-id b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.button-id {\n' + '  float: left;\n' + '}\n' + '.button-id a, .button-id b {\n' + '  color: red;\n' + '}');
    });
  });

  describe('@global prefixed scoped rule', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        button: {
          float: 'left',
          '@global span': {
            color: 'red'
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('.button-id span')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.button-id {\n' + '  float: left;\n' + '}\n' + '.button-id span {\n' + '  color: red;\n' + '}');
    });
  });

  describe('@global prefixed scoped rule with comma separate selectors', function () {
    var sheet = void 0;

    beforeEach(function () {
      sheet = jss.createStyleSheet({
        button: {
          float: 'left',
          '@global a, b': {
            color: 'red'
          }
        }
      });
    });

    it('should add rules', function () {
      (0, _expect2['default'])(sheet.getRule('button')).to.not.be(undefined);
      (0, _expect2['default'])(sheet.getRule('.button-id a, .button-id b')).to.not.be(undefined);
    });

    it('should generate correct CSS', function () {
      (0, _expect2['default'])(sheet.toString()).to.be('.button-id {\n' + '  float: left;\n' + '}\n' + '.button-id a, .button-id b {\n' + '  color: red;\n' + '}');
    });
  });

  describe('@global with nested rules inside', function () {
    var jss2 = void 0;

    beforeEach(function () {
      jss2 = (0, _jss.create)({ plugins: [(0, _index2['default'])(), (0, _jssNested2['default'])()] });
    });

    it('should handle regular nested rules', function () {
      var sheet = jss2.createStyleSheet({
        '@global': {
          button: {
            color: 'red',
            '& span': {
              color: 'green'
            }
          }
        }
      });
      (0, _expect2['default'])(sheet.toString()).to.be('button {\n' + '  color: red;\n' + '}\n' + 'button span {\n' + '  color: green;\n' + '}');
    });

    it('should handle nested rules inside of a rule with comma separated selector', function () {
      var sheet = jss2.createStyleSheet({
        '@global': {
          'button, a': {
            color: 'red',
            '& span': {
              color: 'green'
            }
          }
        }
      });

      (0, _expect2['default'])(sheet.toString()).to.be('button, a {\n' + '  color: red;\n' + '}\n' + 'button span, a span {\n' + '  color: green;\n' + '}');
    });

    it('should handle regular deep nested rules', function () {
      var sheet = jss2.createStyleSheet({
        '@global': {
          button: {
            color: 'red',
            '& span': {
              color: 'green',
              '& b': {
                color: 'blue'
              }
            }
          }
        }
      });

      (0, _expect2['default'])(sheet.toString()).to.be('button {\n' + '  color: red;\n' + '}\n' + 'button span {\n' + '  color: green;\n' + '}\n' + 'button span b {\n' + '  color: blue;\n' + '}');
    });

    it('should handle nested conditional rules', function () {
      var sheet = jss2.createStyleSheet({
        '@global': {
          html: {
            color: 'red',
            '@media (max-width: 767px)': {
              color: 'green'
            }
          }
        }
      });
      (0, _expect2['default'])(sheet.toString()).to.be('html {\n' + '  color: red;\n' + '}\n' + '@media (max-width: 767px) {\n' + '  html {\n' + '    color: green;\n' + '  }\n' + '}');
    });

    it('should handle conditionals with nesting inside', function () {
      var sheet = jss2.createStyleSheet({
        '@global': {
          '@media (max-width: 767px)': {
            html: {
              color: 'red',
              '& button': {
                color: 'green'
              }
            }
          }
        }
      });
      (0, _expect2['default'])(sheet.toString()).to.be('@media (max-width: 767px) {\n' + '  html {\n' + '    color: red;\n' + '  }\n' + '  html button {\n' + '    color: green;\n' + '  }\n' + '}');
    });
  });
});