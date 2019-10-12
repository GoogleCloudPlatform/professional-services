var act = { add: add, update: update, remove: remove }
  , emitterify = require('./emitterify')
  , def = require('./def')
  , is  = require('./is')
  , str = JSON.stringify
  , parse = JSON.parse

module.exports = function set(d, skipEmit) {
  return function(o, existing, max) {
    if (!is.obj(o) && !is.fn(o))
      return o

    if (!is.obj(d)) { 
      var log = existing || o.log || []
        , root = o

      if (!is.def(max)) max = log.max || 0
      if (!max)    log = []
      if (max < 0) log = log.concat(null)
      if (max > 0) {
        var s = str(o)
        root = parse(s) 
        log = log.concat({ type: 'update', value: parse(s), time: log.length })
      } 

      def(log, 'max', max)
      
      root.log 
        ? (root.log = log)
        : def(emitterify(root, null), 'log', log, 1)

      return root
    }

    if (is.def(d.key)) {
      if (!apply(o, d.type, (d.key = '' + d.key).split('.').filter(Boolean), d.value))
        return false
    } else
      return false

    if (o.log && o.log.max) 
      o.log.push((d.time = o.log.length, o.log.max > 0 ? d : null))

    if (!skipEmit && o.emit)
      o.emit('change', d)

    return o
  }
}

function apply(body, type, path, value) {
  var next = path.shift()

  if (!act[type]) 
    return false
  if (path.length) { 
    if (!(next in body)) 
      if (type == 'remove') return true
      else body[next] = {}
    return apply(body[next], type, path, value)
  }
  else {
    return !act[type](body, next, value)
  }
}

function add(o, k, v) {
  is.arr(o) 
    ? o.splice(k, 0, v) 
    : (o[k] = v)
}

function update(o, k, v) {
  if (!is.num(k) && !k) {
    if (!is.obj(v)) return true
    for (var x in o) delete o[x]
    for (var x in v) o[x] = v[x]
  } else 
    o[k] = v 
}

function remove(o, k, v) { 
  is.arr(o) 
    ? o.splice(k, 1)
    : delete o[k]
}