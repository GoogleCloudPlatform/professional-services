var promise = require('./promise')
  , flatten = require('./flatten')
  , def     = require('./def')
  , noop = function(){}

module.exports = function emitterify(body, hooks) {
  body = body || {}
  hooks = hooks || {}
  def(body, 'emit', emit, 1)
  def(body, 'once', once, 1)
  def(body, 'off', off, 1)
  def(body, 'on', on, 1)
  body.on['*'] = body.on['*'] || []
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = []

    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm))

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]))

    return results.reduce(flatten, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce
      cb.type = id
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb
      li.push(cb)
      ;(hooks.on || noop)(cb)
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length
    while (~--i) 
      if (cb == li[i] || cb == li[i].fn || !cb)
        (hooks.off || noop)(li.splice(i, 1)[0])
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb)
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns]
    return body
  }

  function observable(parent, opts) {
    opts = opts || {}
    var o = emitterify(opts.base || promise())
    o.i = 0
    o.li = []
    o.fn = opts.fn
    o.parent = parent
    o.source = opts.fn ? o.parent.source : o
    
    o.on('stop', function(reason){
      o.type
        ? o.parent.off(o.type, o)
        : o.parent.off(o)
      return o.reason = reason
    })

    o.each = function(fn) {
      var n = fn.next ? fn : observable(o, { fn: fn })
      o.li.push(n)
      return n
    }

    o.pipe = function(fn) {
      return fn(o)
    }

    o.map = function(fn){
      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
    }

    o.filter = function(fn){
      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
    }

    o.reduce = function(fn, acc) {
      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
    }

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } })
      o.li.push(n)
      return n
    }

    o.next = function(value) {
      o.resolve && o.resolve(value)
      return o.li.length 
           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
           : value
    }

    o.until = function(stop){
      return !stop     ? 0
           : stop.each ? stop.each(o.stop) // TODO: check clean up on stop too
           : stop.then ? stop.then(o.stop)
           : stop.call ? o.filter(stop).map(o.stop)
                       : 0
    }

    o.off = function(fn){
      return remove(o.li, fn), o
    }

    o.start = function(stop){
      o.until(stop)
      o.source.emit('start')
      return o
    }

    o.stop = function(reason){
      return o.source.emit('stop', reason)
    }

    o[Symbol.asyncIterator] = function(){ 
      return { 
        next: function(){ 
          return o.wait = new Promise(function(resolve){
            o.wait = true
            o.map(function(d, i, n){
              delete o.wait
              o.off(n)
              resolve({ value: d, done: false })
            })
            o.emit('pull', o)
          })
        }
      }
    }

    return o
  }
}