require('../helpers/setup');
var _ = require('lodash');

describe('add-methods - async' + env.ENV_DESC, function() {
  var browser;
  var partials = {};

  require('./midway-base')(this, partials).then(function(_browser) { browser = _browser; });

  var extraAsyncMethods = {
    sleepAndElementById: function(id, cb) {
      var _this = this;
      _this.sleep(200, function(err) {
        if(err) { return cb(err); }
        _this.elementById(id, cb);
      });
    },
    sleepAndText: function(el, cb) {
      var _this = this;
      _this.sleep(200, function(err) {
        if(err) { return cb(err); }
        _this.text(el, cb);
      });
    },
    elementByCssWhenReady: function(selector, timeout, cb) {
      var _this = this;
      _this.waitForElementByCss(selector, timeout, function(err) {
        if(err) { return cb(err); }
        _this.elementByCss(selector, cb);
      });
    }
  };

  var extraElementAsyncMethods = {
    textTwice: function(cb) {
      var _this = this;
      var result = '';
      _this.text(function(err, text) {
        if(err) { return cb(err); }
        result += text;
        _this.text(function(err, text) {
          if(err) { return cb(err); }
          result += text;
          cb(null, result);
        });
      });
    },
  };

  var allExtraMethodNames = _.union(
    _(extraAsyncMethods).keys()
  );

  var noExtraMethodCheck = function() {
    _(allExtraMethodNames).each(function(name) {
      should.not.exist(wd.Webdriver.prototype[name]);
    });
  };

  beforeEach(function() {
    noExtraMethodCheck();
  });

  afterEach(function() {
    _(allExtraMethodNames).each(function(name) {
      wd.removeMethod(name);
    });
    noExtraMethodCheck();
  });

  partials['wd.addAsyncMethod'] =
    '<div id="theDiv">Hello World!</div>';
  it('wd.addAsyncMethod', function(done) {
    _(extraAsyncMethods).each(function(method, name) {
      wd.addAsyncMethod(name, method);
    });
    browser.sleepAndElementById('theDiv', function(err, el) {
      if(err) { return done(err); }
      el.should.exist;
      browser.sleepAndText(el, function(err,text) {
        if(err) { return done(err); }
        text.should.equal('Hello World!');
        done();
      });
    });
  });

  partials['wd.addElementAsyncMethod'] =
    '<div id="theDiv">\n' +
    '  <div id="div1">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '  </div>\n' +
    '  <div id="div2">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '    <span>three</span>\n' +
    '  </div>\n' +
    '</div>\n';
  it('wd.addElementAsyncMethod', function(done) {
    _(extraElementAsyncMethods).each(function(method, name) {
      wd.addElementAsyncMethod(name, method);
    });
    browser.elementById('div1', function(err, el) {
      if(err) { return done(err); }
      el.textTwice(function(err, result) {
        if(err) { return done(err); }
        result.should.equal("one twoone two");
        done();
      });
    });
  });

});
