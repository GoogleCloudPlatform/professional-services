require('../helpers/setup');

describe('wait-for-timeout ' + env.ENV_DESC, function() {
  var Asserter = wd.Asserter;
  var page = '<div id="theDiv"></div>';

  var appendChild =
    'setTimeout(function() {\n' +
    ' $("#theDiv").append("<div class=\\"child\\">a waitFor child</div>");\n' +
    '}, arguments[0]);\n';

  var removeChildren =
    '$("#theDiv").empty();\n';

  var flakyTimeoutAsserter = new Asserter(
    function(browser, cb) {
      browser.text(function(err, text) {
        if(err) { return cb(err); }
        if(text.match(/a waitFor child/)) {
          cb( null, true, "It worked!" );
        } else {
          cb( new Error("Pretending to be a timeout error"), false, "Error branch" );
        }
      });
    }
  );

  var errorAsserter = new Asserter(
    function(browser, cb) {
      browser.text(function(err, text) {
        if(err) { return cb(err); }
        if(text.match(/a waitFor child/)) {
          cb( null, true, "Error ignored!" );
        } else {
          cb( new Error("Pretending to be a real error"), false, "Error branch" );
        }
      });
    }
  );

  var timeoutErrorAsserter = new Asserter(
    function(browser, cb) {
      browser.text(function(err, text) {
        if(err) { return cb(err); }
        cb( new Error("Pretending to be a timeout error"), false, "Error branch" );
      });
    }
  );

  var partials = {};

  var browser;
  require('./midway-base')(this, partials).then(function(_browser) { browser = _browser; });

  partials['browser.waitFor'] = page;
  it('browser.waitFor', function() {
    return browser

      .execute( appendChild, [env.BASE_TIME_UNIT] )
      .text().should.eventually.not.include('a waitFor child')
      .waitFor(flakyTimeoutAsserter , 2 * env.BASE_TIME_UNIT, 100)
        .should.become("It worked!")
      .waitFor( { asserter: flakyTimeoutAsserter, timeout: 2 * env.BASE_TIME_UNIT,
        pollFreq: 100 } )
      .waitFor( flakyTimeoutAsserter , 2 * env.BASE_TIME_UNIT).should.become("It worked!")
      .waitFor( flakyTimeoutAsserter ).should.become("It worked!")

      .execute( removeChildren )
      .execute( appendChild, [env.BASE_TIME_UNIT] )
      .waitFor( errorAsserter , 2 * env.BASE_TIME_UNIT)
        .should.be.rejectedWith(/Pretending to be a real error/)

      .then(function() {
        return browser

          .execute( removeChildren )
          .execute( appendChild, [env.BASE_TIME_UNIT] )
          .waitFor( timeoutErrorAsserter, 0.1 * env.BASE_TIME_UNIT, 100 )
          .should.be.rejectedWith(/Pretending to be a timeout error/);

      });
  });
});
