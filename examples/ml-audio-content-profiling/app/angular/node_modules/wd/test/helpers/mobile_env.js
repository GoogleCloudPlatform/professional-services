var _ = require('lodash');
var devices = {};
devices.android = ['android_phone'];
devices.ios = ['iphone', 'ipad'];

var desireds = {
  selenium: {},
  appium: {}
};

desireds.appium.android_phone = {
    platformName: 'Android',
    platformVersion: '5.1',
    appiumVersion: '1.5.3',
    deviceName: 'Android Emulator',
    browserName: 'Browser',
    deviceOrientation: 'portrait'
};

desireds.appium.iphone = {
    platformName: 'iOS',
    platformVersion: '9.3',
    appiumVersion: '1.5.3',
    deviceName: 'iPhone Simulator',
    browserName: 'Safari',
    deviceOrientation: 'portrait'
};

desireds.appium.ipad = _.merge(_.clone(desireds.appium.iphone), {deviceName: 'iPad Simulator'});

env.APPIUM = process.env.APPIUM;

var cat, device;
_(devices).each(function(_devices, _cat) {
  if(env.BROWSER === _cat){
    device = _devices[0];
    cat = _cat;
  }
  else {
    _(_devices).each(function(_device) {
      if(env.BROWSER === _device) {
        device = _device;
        cat = _cat;
      }
    });
  }
});

if(device){
  env.BROWSER_SKIP = cat;
  env[cat.toUpperCase()] = true;
  env.MOBILE = true;
  env.DESIRED = desireds.appium[device];
}
