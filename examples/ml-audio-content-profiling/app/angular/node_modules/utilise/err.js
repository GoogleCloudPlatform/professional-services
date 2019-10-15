var is = require('./is')
  , to = require('./to')
  , owner = require('./owner')

module.exports = function err(ns){
  return function(d){
    if (!owner.console || !console.error.apply) return d;
    is.arr(arguments[2]) && (arguments[2] = arguments[2].length)
    var args = to.arr(arguments)
      , prefix = '[err][' + (new Date()).toISOString() + ']' + ns

    args.unshift(prefix.red ? prefix.red : prefix)
    return console.error.apply(console, args), d
  }
}