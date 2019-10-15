var username = process.env.KOBITON_USERNAME || "KOBITON_USERNAME";
var accessKey = process.env.KOBITON_ACCESS_KEY || "KOBITON_ACCESS_KEY";

require('colors');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

var wd = require('wd');

var kobitonServer = {
  protocol: 'https',
  host: 'api.kobiton.com',
  auth: process.env.KOBITON_USERNAME + ':' + process.env.KOBITON_ACCESS_KEY
}

// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

var browser = wd.promiseChainRemote(kobitonServer);

// optional extra logging
browser.on('status', function(info) {
  console.log(info.cyan);
});
browser.on('command', function(eventType, command, response) {
  console.log(' > ' + eventType.cyan, command, (response || '').grey);
});
browser.on('http', function(meth, path, data) {
  console.log(' > ' + meth.magenta, path, (data || '').grey);
});

var desired = {
  sessionName: 'Automation test session',
  sessionDescription: 'This is an example for Automation Test on Android device',
  deviceOrientation:  'portrait',
  captureScreenshots: true,
  browserName:        'chrome',
  deviceGroup:        'KOBITON',
  deviceName:         'Galaxy Note5',
  platformVersion:    '6.0.1',
  platformName:       'Android'
};

browser
  .init(desired)
  .get('http://admc.io/wd/test-pages/guinea-pig.html')
  .title()
    .should.become('WD Tests')
  .elementById('i am a link')
  .click()
  .eval('window.location.href')
    .should.eventually.include('guinea-pig2')
  .fin(function() { return browser.quit(); })
  .done();
