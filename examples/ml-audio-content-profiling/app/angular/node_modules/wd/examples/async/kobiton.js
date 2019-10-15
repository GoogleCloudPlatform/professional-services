var username = process.env.KOBITON_USERNAME || "KOBITON_USERNAME";
var accessKey = process.env.KOBITON_ACCESS_KEY || "KOBITON_ACCESS_KEY";

require('colors');
var chai = require('chai');
chai.should();

var wd;
try {
  wd = require('wd');
} catch( err ) {
  wd = require('../../lib/main');
}

var kobitonServer = {
  protocol: 'https',
  host: 'api.kobiton.com',
  auth = process.env.KOBITON_USERNAME + ':' + process.env.KOBITON_ACCESS_KEY
}

var browser = wd.remote(kobitonServer);

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

browser.init(desired, function() {
  browser.get('http://admc.io/wd/test-pages/guinea-pig.html', function() {
    browser.title(function(err, title) {
      title.should.include('WD');
      browser.elementById('i am a link', function(err, el) {
        browser.clickElement(el, function() {
          /* jshint evil: true */
          browser.eval('window.location.href', function(err, href) {
            href.should.include('guinea-pig2');
            browser.quit();
          });
        });
      });
    });
  });
});
