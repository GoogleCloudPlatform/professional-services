var _ = require('lodash');
var underscoreString = require('underscore.string');
var toNumber = underscoreString.toNumber;
var toBoolean = underscoreString.toBoolean;

/*global env:true */
var env = global.env = {};

env.VERBOSE = toBoolean(process.env.VERBOSE);
env.BASE_TIME_UNIT = toNumber(process.env.BASE_TIME_UNIT || 500);
env.TIMEOUT = toNumber(process.env.TIMEOUT || 60000);
env.SHORT = toBoolean(process.env.SHORT);

env.HTTP_CONFIG = {};
if(process.env.HTTP_TIMEOUT)
  { env.HTTP_CONFIG.timeout = toNumber(process.env.HTTP_TIMEOUT); }
if(process.env.HTTP_RETRIES)
  { env.HTTP_CONFIG.retries = toNumber(process.env.HTTP_RETRIES); }
if(process.env.HTTP_RETRY_DELAY)
  { env.HTTP_CONFIG.retryDelay = toNumber(process.env.HTTP_RETRY_DELAY); }

env.DEBUG_CONNECTION = process.env.DEBUG_CONNECTION;

env.REMOTE_CONFIG = process.env.REMOTE_CONFIG;
env.BROWSER = process.env.BROWSER || 'chrome';
env.BROWSER_SKIP = env.BROWSER;

env.MULTI = false;

if(env.BROWSER === 'multi') {
    env.MULTI = true;
}

env.DESIRED = process.env.DESIRED ? JSON.parse(process.env.DESIRED) :
  {browserName: env.BROWSER};

if(env.BROWSER === 'multi') {
  env.DESIRED = {browserName: 'chrome'};
}

require('./mobile_env');

env.EXPRESS_PORT = toNumber(process.env.EXPRESS_PORT || 3000);
env.PROXY_PORT = toNumber(process.env.PROXY_PORT || 5050);

if(env.ANDROID){
  env.TIMEOUT = 300000;
}

env.SAUCE_CONNECT = toBoolean(process.env.SAUCE_CONNECT);
env.SAUCE = toBoolean(process.env.SAUCE) || env.SAUCE_CONNECT;

env.TRAVIS_JOB_ID = process.env.TRAVIS_JOB_ID;
env.TRAVIS_JOB_NUMBER = process.env.TRAVIS_JOB_NUMBER;
env.TRAVIS_BUILD_NUMBER = process.env.TRAVIS_BUILD_NUMBER;

if( env.TRAVIS_JOB_ID ){
  env.TRAVIS = true;
}

if(env.SAUCE) {
  env.MIDWAY_ROOT_URL = "http://localhost:" + env.PROXY_PORT + '/' +
    env.EXPRESS_PORT;
} else {
  env.MIDWAY_ROOT_URL = "http://localhost:" +  env.EXPRESS_PORT;
}

if(env.SAUCE){
  env.BASE_TIME_UNIT = toNumber(process.env.BASE_TIME_UNIT || 4000);
  env.TIMEOUT = toNumber(process.env.TIMEOUT || 600000);

  env.SAUCE_JOB_ID =
    env.TRAVIS_BUILD_NUMBER ||
    process.env.SAUCE_JOB_ID ||
    Math.round(new Date().getTime() / (1000*60));
  env.SAUCE_USERNAME = process.env.SAUCE_USERNAME;
  env.SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY;
  env.SAUCE_PLATFORM = process.env.SAUCE_PLATFORM || 'Linux';
  env.SAUCE_RECORD_VIDEO = toBoolean(process.env.SAUCE_RECORD_VIDEO);
  env.TUNNEL_IDENTIFIER = process.env.TUNNEL_IDENTIFIER;

  if(env.SAUCE_CONNECT){
    env.REMOTE_CONFIG =
      'http://' + env.SAUCE_USERNAME + ':' + env.SAUCE_ACCESS_KEY +
        '@localhost:4445/wd/hub';
  } else {
    env.REMOTE_CONFIG =
      'http://' + env.SAUCE_USERNAME + ':' + env.SAUCE_ACCESS_KEY +
        '@ondemand.saucelabs.com/wd/hub';
  }

  if(!env.DESIRED.platformName) {
    env.DESIRED.platform = env.DESIRED.platform || env.SAUCE_PLATFORM;
  }
  env.DESIRED.build = env.SAUCE_JOB_ID;
  env.DESIRED["record-video"] = env.SAUCE_RECORD_VIDEO;
  env.DESIRED.tags = env.DESIRED.tags || [];
  env.DESIRED.tags.push('wd');
  if(env.TRAVIS_JOB_NUMBER){
    env.DESIRED.tags.push('travis');
  }
  if(env.TUNNEL_IDENTIFIER) {
    env.DESIRED['tunnel-identifier'] = env.TUNNEL_IDENTIFIER;
  }

  // special case for window
  if (env.BROWSER === 'explorer') {
    env.DESIRED.browserName = 'internet explorer';
    env.DESIRED.platform = 'Windows 8';
    env.DESIRED.version = '10';
  }
}

if(env.MULTI){
    env.ENV_DESC =  '(' + (env.SAUCE? 'sauce' : 'local') + ', multi)';
} else {
    env.ENV_DESC =  '(' + (env.SAUCE? 'sauce' : 'local') + ', ' +
        (env.DESIRED.browserName || 'default') + ')';
}
