'use strict';

// -------------------------------------------
// Serves the /pages directory
// -------------------------------------------
module.exports = function pages(ripple) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      server = _ref.server,
      dir = _ref.dir;

  log('creating');
  server = ripple.server || server;
  if (!server || !dir) return ripple;
  expressify(server).use(compression(), serve(resolve(dir, './pages'), { redirect: false })).use('*', compression(), serve(resolve(dir, './pages')));
  return ripple;
};

var expressify = function expressify(server) {
  return server.express || key('_events.request')(server) || server.on('request', express())._events.request;
};

var compression = require('compression'),
    key = require('utilise/key'),
    _require = require('path'),
    resolve = _require.resolve,
    express = require('express'),
    serve = require('serve-static'),
    log = require('utilise/log')('[ri/pages]');