require('../helpers/setup');
var _ = require('lodash');


describe('mobile ' + env.ENV_DESC,
    skip('chrome', 'firefox', 'explorer', env.SAUCE ? 'ios' : undefined), function() {
  var partials = {};

  var browser;
  require('./midway-base')(this, partials).then(function(_browser) { browser = _browser; });

  it('browser.setOrientation', skip('ios'), function() {
    return browser
      .setOrientation('LANDSCAPE');
  });

  if (!env.SAUCE) {
    it('browser.settings', function() {
      return browser
        .settings();
    });

    it('browser.updateSettings', function() {
      return browser
        .updateSettings({'cyberdelia': 'open'})
        .settings().should.eventually.have.property('cyberdelia');
    });
  }

});
