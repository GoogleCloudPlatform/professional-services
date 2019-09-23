var is = require('./is')
  , to = require('./to')
  , key = require('./key')
  , owner = require('./owner')
  , split = require('./split')
  , client = require('./client')
  , identity = require('./identity')
  , DEBUG = strip((client ? (owner.location.search.match(/debug=(.*?)(&|$)/) || [])[1] : key('process.env.DEBUG')(owner)) || '')
  , whitelist = DEBUG.split(',').map(split('/'))

module.exports = function deb(ns){
  return DEBUG == '*' || whitelist.some(matches(ns)) ? out : identity

  function out(d){
    if (!owner.console || !console.log.apply) return d;
    is.arr(arguments[2]) && (arguments[2] = arguments[2].length)
    var args = to.arr(arguments)
      , prefix = '[deb][' + (new Date()).toISOString() + ']' + ns

    args.unshift(prefix.grey ? prefix.grey : prefix)
    return console.log.apply(console, args), d
  }
}

function matches(ns) {
  ns = strip(ns).split('/')
  return function(arr){
    return arr.length == 1 ? arr[0] == ns[0]
         : arr.length == 2 ? arr[0] == ns[0] && arr[1] == ns[1]
                           : false 
  }
}

function strip(str) {
  return str.replace(/(\[|\])/g, '')
}