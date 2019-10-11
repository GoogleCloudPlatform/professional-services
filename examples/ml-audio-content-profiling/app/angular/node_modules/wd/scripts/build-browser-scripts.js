var fs = require('fs');
var mkdirp = require('mkdirp').sync;
var safeExecute = fs.readFileSync(__dirname + '/../browser-scripts/safe-execute.js', 'utf8').replace(/[\r\n]/g, '').trim();
var safeExecuteAsync = fs.readFileSync(__dirname + '/../browser-scripts/safe-execute-async.js', 'utf8').replace(/[\r\n]/g, '').trim();
var waitForCondInBrowser = fs.readFileSync(__dirname + '/../browser-scripts/wait-for-cond-in-browser.js', 'utf8').replace(/[\r\n]/g, '').trim();
mkdirp(__dirname + '/../build');
fs.writeFileSync(__dirname + '/../build/safe-execute.js', 'module.exports = "' + safeExecute + '"');
fs.writeFileSync(__dirname + '/../build/safe-execute-async.js', 'module.exports = "' + safeExecuteAsync + '"');
fs.writeFileSync(__dirname + '/../build/wait-for-cond-in-browser.js', 'module.exports = "' + waitForCondInBrowser + '"');