/* global sauceJobTitle, mergeDesired */

require('../helpers/setup');

describe('basic ' + env.ENV_DESC, function() {
  this.timeout(env.TIMEOUT);

  var browser;
  var allPassed = true;

  before(function() {
    browser = wd.promiseChainRemote(env.REMOTE_CONFIG);
    var sauceExtra = {
      name: sauceJobTitle(this.runnable().parent.title),
      tags: ['e2e']
    };
    var desired = mergeDesired(env.DESIRED, env.SAUCE? sauceExtra : null );
    desired.allowW3C = true;
    return browser
      .configureLogging()
      .init(desired);
  });

  beforeEach(function() {
    return browser.get('http://admc.io/wd/test-pages/guinea-pig.html');
  });

  afterEach(function() {
    allPassed = allPassed && (this.currentTest.state === 'passed');
  });

  after(function() {
    return browser
      .quit().then(function() {
        if(env.SAUCE) { return(browser.sauceJobStatus(allPassed)); }
      });
  });

  it("should retrieve the page title", function() {
    return browser
      .title().should.eventually.include("WD");
  });    

  it("submit element should be clicked", function() {
    /* jshint evil: true */
    return browser
      .elementByCss("#submit")
      .click();
  });

  it("should send keys", function () {
    return browser
      .elementByCss("#comments")
      .sendKeys("Hello world");
  });

  it("should retrieve the page source", function () {
    return browser
      .source()
      .should.eventually.include('<html');
  });

  it("should retrieve screenshot", function () {
    return browser
      .takeScreenshot();
  });
});


