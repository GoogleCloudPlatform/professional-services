var log = require('./log')('[perf]')
  , client = require('./client')

module.exports =  function perf(fn, msg, say) {
  return function(){
    /* istanbul ignore next */
    var start  = client ? performance.now() : process.hrtime()
      , retval = fn.apply(this, arguments)

    retval instanceof Promise
      ? retval.then(function(){ report(start) })
      : report(start)

    return retval
  }

  function report(start){
    var diff = client ? performance.now() - start : process.hrtime(start)
    if (!client) diff = (diff[0]*1e3 + diff[1]/1e6)
    diff = Math.round(diff*100)/100
    ;(say || log)(msg || fn.name, diff, 'ms')
  }
}